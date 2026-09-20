/**
 * Gantt View Component: Interactive SVG Timeline, Enhanced Dependency Arrows, Baseline Ghost Bars & Bidirectional Drag & Drop
 */

import { WORKSTREAMS } from '../models/taskModel.js';
import { DependencyEngine } from '../engine/dependencyEngine.js';
import { BaselineEngine } from '../engine/baselineEngine.js';
import { CalendarEngine } from '../engine/calendarEngine.js';

export class GanttView {
    constructor(containerElement, onTaskUpdate) {
        this.container = containerElement;
        this.onTaskUpdate = onTaskUpdate;
        this.zoom = 'Week';
        this.showCriticalPath = false;
        this.showBaselineGhost = true;
        this.dragState = null;
        this.dayWidth = 28;
        this.rowHeight = 33;
        this.calendar = null;
    }

    render(tasks, calendar) {
        if (!this.container) return;

        this.tasks = tasks;
        this.calendar = calendar;

        const bounds = this.getTimelineBounds(tasks);
        this.startDate = bounds.start;
        this.endDate = bounds.end;
        this.totalDays = DependencyEngine.getWorkingDays(this.startDate, this.endDate, this.calendar) + 14;

        if (this.zoom === 'Day') this.dayWidth = 44;
        else if (this.zoom === 'Week') this.dayWidth = 28;
        else if (this.zoom === 'Month') this.dayWidth = 14;

        const timelineWidth = Math.max(800, this.totalDays * this.dayWidth);
        const visibleTasks = this.getVisibleTasks(tasks);

        const html = `
            <div class="gantt-container flex flex-col h-full bg-white overflow-hidden select-none">
                <!-- Gantt Controls Toolbar -->
                <div class="gantt-toolbar flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200 text-xs gap-2">
                    <!-- Zoom Controls -->
                    <div class="flex items-center gap-1">
                        <span class="text-slate-500 font-semibold uppercase text-[10px]">Zoom:</span>
                        <div class="inline-flex rounded-md shadow-sm" role="group">
                            <button data-zoom="Day" class="px-2.5 py-1 text-xs font-medium rounded-l border border-slate-300 ${this.zoom === 'Day' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-50'} transition">Day</button>
                            <button data-zoom="Week" class="px-2.5 py-1 text-xs font-medium border-t border-b border-slate-300 ${this.zoom === 'Week' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-50'} transition">Week</button>
                            <button data-zoom="Month" class="px-2.5 py-1 text-xs font-medium rounded-r border border-slate-300 ${this.zoom === 'Month' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:bg-slate-50'} transition">Month</button>
                        </div>
                    </div>

                    <!-- Toggles -->
                    <div class="flex items-center gap-3">
                        <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                            <input type="checkbox" id="toggle-critical-path" ${this.showCriticalPath ? 'checked' : ''} class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                            <span class="${this.showCriticalPath ? 'text-red-700 font-bold' : ''}">Critical Path</span>
                        </label>
                        <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                            <input type="checkbox" id="toggle-baseline-ghost" ${this.showBaselineGhost ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5">
                            <span>Baseline Shadows</span>
                        </label>
                    </div>
                </div>

                <!-- Timeline View Area -->
                <div class="gantt-scroll-pane flex-1 overflow-auto relative bg-white">
                    <div style="width: ${timelineWidth}px;" class="min-h-full relative">
                        <!-- Header Calendar Row -->
                        <div class="gantt-header sticky top-0 z-20 bg-slate-100 border-b border-slate-300 font-medium text-slate-600 text-xs shadow-sm">
                            ${this.renderHeader(timelineWidth)}
                        </div>

                        <!-- Main Gantt SVG Layer -->
                        <div class="gantt-body relative" style="height: ${visibleTasks.length * this.rowHeight}px;">
                            <!-- Grid Background Lines with Calendar Shading -->
                            ${this.renderGridLines(timelineWidth, visibleTasks.length)}

                            <!-- Predecessor Connector Lines SVG -->
                            <svg class="gantt-connectors-layer absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                                ${this.renderDependencies(visibleTasks)}
                            </svg>

                            <!-- Task Bars Layer -->
                            <div class="gantt-bars-layer absolute inset-0 w-full h-full z-15">
                                ${visibleTasks.map((task, idx) => this.renderTaskBar(task, idx)).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners(visibleTasks);
    }

    getTimelineBounds(tasks) {
        let minDate = new Date();
        let maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);

        if (tasks && tasks.length > 0) {
            let first = true;
            tasks.forEach(t => {
                if (t.start) {
                    const s = new Date(t.start);
                    if (first || s < minDate) minDate = s;
                }
                if (t.finish) {
                    const f = new Date(t.finish);
                    if (first || f > maxDate) maxDate = f;
                }
                if (t.baseline && t.baseline.finish) {
                    const bf = new Date(t.baseline.finish);
                    if (bf > maxDate) maxDate = bf;
                }
                first = false;
            });
        }

        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 14);

        return {
            start: minDate.toISOString().split('T')[0],
            end: maxDate.toISOString().split('T')[0]
        };
    }

    getVisibleTasks(tasks) {
        const hiddenIds = new Set();
        const idMap = new Map(tasks.map(t => [t.id, t]));

        tasks.forEach(t => {
            if (t.parentId) {
                let parent = idMap.get(t.parentId);
                while (parent) {
                    if (parent.expanded === false) {
                        hiddenIds.add(t.id);
                        break;
                    }
                    parent = parent.parentId ? idMap.get(parent.parentId) : null;
                }
            }
        });

        return tasks.filter(t => !hiddenIds.has(t.id));
    }

    renderHeader(timelineWidth) {
        const monthsHtml = [];
        const daysHtml = [];
        
        let curr = new Date(this.startDate);
        const end = new Date(this.endDate);
        
        let currentMonth = '';
        let monthWidth = 0;

        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0];
            const monthName = curr.toLocaleString('default', { month: 'short', year: 'numeric' });
            const dayNum = curr.getDate();

            const isHoliday = CalendarEngine.getHoliday(dateStr, this.calendar);
            const isOvertime = CalendarEngine.getOvertime(dateStr, this.calendar);
            const isWorking = CalendarEngine.isWorkingDay(dateStr, this.calendar);

            let bgClass = 'bg-white text-slate-700 font-semibold';
            let titleAttr = '';

            if (isOvertime) {
                bgClass = 'bg-amber-200 text-amber-900 font-bold';
                titleAttr = `Overtime: ${isOvertime.note}`;
            } else if (isHoliday) {
                bgClass = 'bg-red-200 text-red-900 font-bold';
                titleAttr = `Holiday: ${isHoliday.name}`;
            } else if (!isWorking) {
                bgClass = 'bg-slate-200/70 text-slate-400 font-normal';
                titleAttr = 'Weekly Off';
            }

            daysHtml.push(`
                <div style="width: ${this.dayWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-200 text-[10px] ${bgClass}" title="${titleAttr}">
                    ${dayNum}
                </div>
            `);

            if (monthName !== currentMonth) {
                if (currentMonth) {
                    monthsHtml.push(`<div style="width: ${monthWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-300 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wide truncate bg-slate-100">${currentMonth}</div>`);
                }
                currentMonth = monthName;
                monthWidth = this.dayWidth;
            } else {
                monthWidth += this.dayWidth;
            }

            curr.setDate(curr.getDate() + 1);
        }

        if (currentMonth) {
            monthsHtml.push(`<div style="width: ${monthWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-300 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wide truncate bg-slate-100">${currentMonth}</div>`);
        }

        return `
            <div class="flex">${monthsHtml.join('')}</div>
            <div class="flex">${daysHtml.join('')}</div>
        `;
    }

    renderGridLines(timelineWidth, rowCount) {
        const columns = [];
        let curr = new Date(this.startDate);
        const end = new Date(this.endDate);

        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0];
            const isHoliday = CalendarEngine.getHoliday(dateStr, this.calendar);
            const isOvertime = CalendarEngine.getOvertime(dateStr, this.calendar);
            const isWorking = CalendarEngine.isWorkingDay(dateStr, this.calendar);

            let bgClass = '';
            if (isOvertime) {
                bgClass = 'bg-amber-50/50';
            } else if (isHoliday) {
                bgClass = 'bg-red-50/40';
            } else if (!isWorking) {
                bgClass = 'bg-slate-100/70';
            }

            columns.push(`
                <div style="width: ${this.dayWidth}px;" class="h-full flex-shrink-0 border-r border-slate-100 ${bgClass}"></div>
            `);
            curr.setDate(curr.getDate() + 1);
        }

        return `
            <div class="absolute inset-0 flex pointer-events-none">
                ${columns.join('')}
            </div>
        `;
    }

    dateToPixel(dateStr) {
        if (!dateStr) return 0;
        const d = new Date(dateStr);
        const start = new Date(this.startDate);
        const days = (d - start) / (1000 * 60 * 60 * 24);
        return Math.max(0, days * this.dayWidth);
    }

    pixelToDate(px) {
        const days = Math.round(px / this.dayWidth);
        const start = new Date(this.startDate);
        start.setDate(start.getDate() + days);
        return start.toISOString().split('T')[0];
    }

    renderTaskBar(task, rowIndex) {
        const y = rowIndex * this.rowHeight + 4;
        const x = this.dateToPixel(task.start);
        const finishX = this.dateToPixel(task.finish);
        const width = Math.max(this.dayWidth, finishX - x + this.dayWidth);
        
        const ws = WORKSTREAMS[task.workstream] || WORKSTREAMS['HW'];
        const isCritical = this.showCriticalPath && task.isCritical;
        const variance = BaselineEngine.getVariance(task);

        let baselineGhostHtml = '';
        if (this.showBaselineGhost && task.baseline && task.baseline.start && task.baseline.finish) {
            const bx = this.dateToPixel(task.baseline.start);
            const bFinishX = this.dateToPixel(task.baseline.finish);
            const bWidth = Math.max(this.dayWidth, bFinishX - bx + this.dayWidth);
            const ghostY = y + 18;

            baselineGhostHtml = `
                <div style="left: ${bx}px; top: ${ghostY}px; width: ${bWidth}px; height: 6px;" class="absolute rounded bg-slate-300/70 border border-slate-400 border-dashed pointer-events-none z-10" title="Baseline: ${task.baseline.start} to ${task.baseline.finish}"></div>
            `;
        }

        if (task.isSummary) {
            return `
                ${baselineGhostHtml}
                <div data-task-id="${task.id}" style="left: ${x}px; top: ${y + 4}px; width: ${width}px; height: 16px;" class="gantt-summary-bar absolute group cursor-pointer z-15">
                    <div class="w-full h-2.5 bg-slate-800 rounded-t flex items-center relative">
                        <div class="h-full bg-slate-600 rounded-t" style="width: ${task.progress || 0}%;"></div>
                    </div>
                    <div class="absolute -left-1 top-0 w-2 h-4 bg-slate-800 clip-path-left"></div>
                    <div class="absolute -right-1 top-0 w-2 h-4 bg-slate-800 clip-path-right"></div>
                    <span class="absolute left-full ml-2 top-0 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                        ${this.escapeHtml(task.name)} (${task.progress}%)
                    </span>
                </div>
            `;
        }

        if (task.isMilestone) {
            const mx = x + this.dayWidth / 2 - 8;
            return `
                ${baselineGhostHtml}
                <div data-task-id="${task.id}" style="left: ${mx}px; top: ${y + 2}px;" class="gantt-milestone absolute cursor-move group z-20" title="${this.escapeHtml(task.name)} (${task.start})">
                    <div class="w-4 h-4 bg-amber-500 transform rotate-45 border-2 border-amber-600 shadow-sm group-hover:scale-115 transition-transform"></div>
                    <span class="absolute left-5 top-0 text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                        ◆ ${this.escapeHtml(task.name)}
                    </span>
                </div>
            `;
        }

        let leadTimeHtml = '';
        if (task.leadTime > 0) {
            const lx = finishX + this.dayWidth;
            const lWidth = task.leadTime * this.dayWidth;
            leadTimeHtml = `
                <div style="left: ${lx}px; top: ${y + 6}px; width: ${lWidth}px; height: 12px;" class="absolute bg-amber-100 border border-amber-300 border-dashed rounded-r flex items-center px-1 text-[9px] font-bold text-amber-800 truncate z-10" title="Procurement Lead Time: +${task.leadTime} days">
                    +${task.leadTime}d Lead
                </div>
            `;
        }

        const barColor = isCritical ? '#ef4444' : ws.color;
        const progressWidth = `${task.progress || 0}%`;

        return `
            ${baselineGhostHtml}
            ${leadTimeHtml}
            <div data-task-id="${task.id}" style="left: ${x}px; top: ${y}px; width: ${width}px; height: 22px; background-color: ${barColor};" class="gantt-task-bar absolute rounded shadow-sm border ${isCritical ? 'border-red-600 ring-2 ring-red-300' : 'border-black/10'} group cursor-move z-15 flex items-center text-white text-[11px] font-medium px-2 select-none overflow-visible">
                <div style="width: ${progressWidth};" class="absolute left-0 top-0 bottom-0 bg-black/25 rounded-l pointer-events-none"></div>

                <span class="relative z-10 truncate text-[11px] font-medium">
                    ${this.escapeHtml(task.name)} ${task.getFormattedAssignments() !== 'Unassigned' ? `(${this.escapeHtml(task.getFormattedAssignments())})` : ''}
                </span>

                ${variance.hasBaseline && variance.finishVarianceDays !== 0 ? `
                    <span class="absolute left-full ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${variance.badgeClass} whitespace-nowrap z-20">
                        ${variance.statusText}
                    </span>
                ` : ''}

                <div data-handle="right" data-task-id="${task.id}" class="gantt-handle-right absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/40 hover:bg-white cursor-ew-resize rounded-r transition-all"></div>
            </div>
        `;
    }

    renderDependencies(visibleTasks) {
        const taskRowIndexMap = new Map(visibleTasks.map((t, idx) => [t.id, idx]));
        const paths = [];

        visibleTasks.forEach(task => {
            const preds = DependencyEngine.parsePredecessors(task.predecessors, visibleTasks);
            preds.forEach(pred => {
                const targetTask = pred.targetTask;
                if (!targetTask) return;

                const fromIndex = taskRowIndexMap.get(targetTask.id);
                const toIndex = taskRowIndexMap.get(task.id);

                if (fromIndex === undefined || toIndex === undefined) return;

                const fromY = fromIndex * this.rowHeight + 15;
                const toY = toIndex * this.rowHeight + 15;

                const fromX = this.dateToPixel(targetTask.finish) + this.dayWidth;
                const toX = this.dateToPixel(task.start);

                const isCritical = this.showCriticalPath && (task.isCritical && targetTask.isCritical);
                const strokeColor = isCritical ? '#ef4444' : '#475569';
                const strokeWidth = isCritical ? 2.5 : 1.8;
                const markerId = isCritical ? 'arrowhead-red' : 'arrowhead-slate';

                const midX = fromX + 12;
                let pathData = '';

                if (midX < toX) {
                    pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
                } else {
                    const loopY = (fromY + toY) / 2;
                    pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${loopY} L ${toX - 10} ${loopY} L ${toX - 10} ${toY} L ${toX} ${toY}`;
                }

                paths.push(`
                    <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${markerId})"/>
                `);
            });
        });

        return `
            <defs>
                <marker id="arrowhead-slate" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
                </marker>
                <marker id="arrowhead-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444"/>
                </marker>
            </defs>
            ${paths.join('')}
        `;
    }

    attachEventListeners(visibleTasks) {
        if (!this.container) return;

        this.container.querySelectorAll('[data-zoom]').forEach(btn => {
            btn.onclick = () => {
                this.zoom = btn.getAttribute('data-zoom');
                this.render(this.tasks, this.calendar);
            };
        });

        const cpToggle = this.container.querySelector('#toggle-critical-path');
        if (cpToggle) {
            cpToggle.onchange = (e) => {
                this.showCriticalPath = e.target.checked;
                this.render(this.tasks, this.calendar);
            };
        }

        const bgToggle = this.container.querySelector('#toggle-baseline-ghost');
        if (bgToggle) {
            bgToggle.onchange = (e) => {
                this.showBaselineGhost = e.target.checked;
                this.render(this.tasks, this.calendar);
            };
        }

        this.initDragAndDrop(visibleTasks);
    }

    initDragAndDrop(visibleTasks) {
        const pane = this.container.querySelector('.gantt-scroll-pane');
        if (!pane) return;

        let activeTaskId = null;
        let isResizing = false;
        let startMouseX = 0;
        let initialTaskStart = null;
        let initialDuration = 1;
        let draggedBarElement = null;

        const onMouseDown = (e) => {
            const handle = e.target.closest('[data-handle="right"]');
            const bar = e.target.closest('[data-task-id]');

            if (!bar) return;

            activeTaskId = bar.getAttribute('data-task-id');
            const task = this.tasks.find(t => t.id === activeTaskId);
            if (!task || task.isSummary) return;

            isResizing = Boolean(handle);
            startMouseX = e.clientX;
            initialTaskStart = task.start;
            initialDuration = task.duration;
            draggedBarElement = bar;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!activeTaskId || !draggedBarElement) return;

            const deltaPx = e.clientX - startMouseX;
            const deltaDays = Math.round(deltaPx / this.dayWidth);
            const task = this.tasks.find(t => t.id === activeTaskId);
            if (!task) return;

            if (isResizing) {
                const newDuration = Math.max(1, initialDuration + deltaDays);
                task.duration = newDuration;
                task.finish = DependencyEngine.addWorkingDays(task.start, task.duration, this.calendar);
            } else {
                const newStart = this.pixelToDate(this.dateToPixel(initialTaskStart) + deltaPx);
                task.start = newStart;
                task.finish = DependencyEngine.addWorkingDays(task.start, task.duration, this.calendar);
            }

            this.render(this.tasks, this.calendar);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (activeTaskId && this.onTaskUpdate) {
                this.onTaskUpdate(activeTaskId);
            }

            activeTaskId = null;
            draggedBarElement = null;
        };

        pane.addEventListener('mousedown', onMouseDown);
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}
