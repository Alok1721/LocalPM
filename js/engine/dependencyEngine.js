/**
 * Dependency Engine: WBS Tree, Dependency Parser, Auto-Scheduler, and Critical Path Method (CPM)
 */

import { CalendarEngine } from './calendarEngine.js';

export class DependencyEngine {

    /**
     * Add working days to a date string using CalendarEngine
     */
    static addWorkingDays(startDateStr, days, calendar) {
        return CalendarEngine.addWorkingDays(startDateStr, days, calendar);
    }

    /**
     * Calculate working days between two dates using CalendarEngine
     */
    static getWorkingDays(startDateStr, endDateStr, calendar) {
        return CalendarEngine.getWorkingDays(startDateStr, endDateStr, calendar);
    }

    /**
     * Update WBS numbers and indent hierarchy for all tasks
     */
    static updateWBSHierarchy(tasks, calendar) {
        const idMap = new Map();
        tasks.forEach(t => idMap.set(t.id, t));

        // Group children by parentId
        const childrenMap = new Map();
        tasks.forEach(t => {
            const pid = t.parentId || 'root';
            if (!childrenMap.has(pid)) childrenMap.set(pid, []);
            childrenMap.get(pid).push(t);
        });

        // Helper to recursively assign WBS
        function assignWBS(parentId, prefix) {
            const children = childrenMap.get(parentId) || [];
            children.forEach((child, index) => {
                const num = index + 1;
                child.wbs = prefix ? `${prefix}.${num}` : `${num}`;
                const hasChildren = childrenMap.has(child.id) && childrenMap.get(child.id).length > 0;
                child.isSummary = hasChildren;
                if (hasChildren) {
                    assignWBS(child.id, child.wbs);
                }
            });
        }

        assignWBS('root', '');

        // Recalculate summary tasks bottom-up
        this.recalculateSummaryTasks(tasks, childrenMap, calendar);
    }

    /**
     * Recalculate summary task dates, duration, and progress from subtasks
     */
    static recalculateSummaryTasks(tasks, childrenMap, calendar) {
        const summaryTasks = tasks.filter(t => t.isSummary);
        summaryTasks.sort((a, b) => b.wbs.split('.').length - a.wbs.split('.').length);

        summaryTasks.forEach(parent => {
            const children = childrenMap.get(parent.id) || [];
            if (children.length === 0) return;

            let minStart = null;
            let maxFinish = null;
            let totalWeightedProgress = 0;
            let totalDuration = 0;

            children.forEach(child => {
                if (child.start) {
                    if (!minStart || new Date(child.start) < new Date(minStart)) {
                        minStart = child.start;
                    }
                }
                if (child.finish) {
                    if (!maxFinish || new Date(child.finish) > new Date(maxFinish)) {
                        maxFinish = child.finish;
                    }
                }
                const dur = Math.max(1, child.duration || 1);
                totalDuration += dur;
                totalWeightedProgress += (child.progress || 0) * dur;
            });

            if (minStart) parent.start = minStart;
            if (maxFinish) parent.finish = maxFinish;
            if (minStart && maxFinish) {
                parent.duration = this.getWorkingDays(minStart, maxFinish, calendar);
            }
            parent.progress = totalDuration > 0 ? Math.round(totalWeightedProgress / totalDuration) : 0;
        });
    }

    /**
     * Parse predecessor string into structured objects
     */
    static parsePredecessors(predStr, tasks) {
        if (!predStr || typeof predStr !== 'string') return [];
        
        const wbsMap = new Map();
        tasks.forEach((t, idx) => {
            wbsMap.set(t.wbs, t);
            wbsMap.set((idx + 1).toString(), t);
            wbsMap.set(t.id, t);
        });

        const items = predStr.split(',').map(s => s.trim()).filter(Boolean);
        const results = [];

        items.forEach(item => {
            const match = item.match(/^([\w.]+)(FS|SS|FF|SF)?(?:([+-])(\d+)[dD]?)?$/i);
            if (match) {
                const targetRef = match[1];
                const type = (match[2] || 'FS').toUpperCase();
                const sign = match[3] === '-' ? -1 : 1;
                const lag = match[4] ? parseInt(match[4], 10) * sign : 0;

                const targetTask = wbsMap.get(targetRef);
                if (targetTask) {
                    results.push({
                        targetTask,
                        type,
                        lag
                    });
                }
            }
        });

        return results;
    }

    /**
     * Run Auto-Scheduler & Critical Path Method (CPM) using Calendar Engine
     */
    static scheduleProject(tasks, calendar) {
        if (!tasks || tasks.length === 0) return;

        this.updateWBSHierarchy(tasks, calendar);

        const leafTasks = tasks.filter(t => !t.isSummary);
        let changed = true;
        let iterations = 0;
        const maxIterations = tasks.length * 2;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            leafTasks.forEach(task => {
                const preds = this.parsePredecessors(task.predecessors, tasks);
                let earliestStart = new Date(task.start);

                preds.forEach(pred => {
                    const predTask = pred.targetTask;
                    if (!predTask) return;

                    let requiredDate;
                    const predStart = new Date(predTask.start);
                    const predFinish = new Date(predTask.finish);

                    switch (pred.type) {
                        case 'FS':
                            requiredDate = new Date(predFinish);
                            requiredDate.setDate(requiredDate.getDate() + 1);
                            break;
                        case 'SS':
                            requiredDate = new Date(predStart);
                            break;
                        case 'FF':
                            requiredDate = new Date(predFinish);
                            requiredDate.setDate(requiredDate.getDate() - (task.duration - 1));
                            break;
                        case 'SF':
                            requiredDate = new Date(predStart);
                            requiredDate.setDate(requiredDate.getDate() - (task.duration - 1));
                            break;
                        default:
                            requiredDate = new Date(predFinish);
                            requiredDate.setDate(requiredDate.getDate() + 1);
                    }

                    if (pred.lag !== 0) {
                        requiredDate.setDate(requiredDate.getDate() + pred.lag);
                    }

                    if (requiredDate > earliestStart) {
                        earliestStart = requiredDate;
                    }
                });

                const calculatedStart = earliestStart.toISOString().split('T')[0];
                const calculatedFinish = this.addWorkingDays(calculatedStart, task.duration, calendar);

                if (task.start !== calculatedStart || task.finish !== calculatedFinish) {
                    task.start = calculatedStart;
                    task.finish = calculatedFinish;
                    changed = true;
                }
            });
        }

        this.updateWBSHierarchy(tasks, calendar);
        this.calculateCriticalPath(tasks);
    }

    /**
     * Calculate Critical Path (CPM) Total Slack
     */
    static calculateCriticalPath(tasks) {
        if (tasks.length === 0) return;

        let maxProjectFinish = null;
        tasks.forEach(t => {
            if (t.finish && (!maxProjectFinish || new Date(t.finish) > new Date(maxProjectFinish))) {
                maxProjectFinish = t.finish;
            }
        });

        if (!maxProjectFinish) return;

        tasks.forEach(t => {
            const finishDate = new Date(t.finish);
            const projFinish = new Date(maxProjectFinish);
            const diffDays = Math.abs((projFinish - finishDate) / (1000 * 60 * 60 * 24));

            const isTargetOfPred = tasks.some(other => {
                const otherPreds = this.parsePredecessors(other.predecessors, tasks);
                return otherPreds.some(p => p.targetTask.id === t.id);
            });

            if (!isTargetOfPred && diffDays <= 1) {
                t.isCritical = true;
                t.slack = 0;
            } else if (t.baseline && t.baseline.finish) {
                const baselineFinish = new Date(t.baseline.finish);
                const currentFinish = new Date(t.finish);
                const drift = Math.round((currentFinish - baselineFinish) / (1000 * 60 * 60 * 24));
                t.isCritical = drift > 0;
                t.slack = Math.max(0, -drift);
            } else {
                t.isCritical = false;
                t.slack = 0;
            }
        });
    }
}
