/**
 * Dependency Tree & Network Diagram View (PERT Chart):
 * Visual DAG showing task dependency relationships, predecessor chains, and critical path analysis.
 */

import { HARDWARE_STAGES, WORKSTREAMS, STATUS_PILLS } from '../models/taskModel.js';
import { DependencyEngine } from '../engine/dependencyEngine.js';

export class DependencyTreeView {
    constructor(containerElement) {
        this.container = containerElement;
    }

    render(tasks) {
        if (!this.container) return;

        this.tasks = tasks || [];
        const leafTasks = this.tasks.filter(t => !t.isSummary);

        const html = `
            <div class="deptree-view flex flex-col h-full bg-slate-100 overflow-auto p-4 select-none">
                <!-- Header Toolbar -->
                <div class="flex items-center justify-between mb-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                            Project Network Diagram & Dependency Tree Analysis
                        </h2>
                        <p class="text-xs text-slate-500">Visual dependency flowchart showing predecessor chains, task connections, and critical path bottlenecks.</p>
                    </div>
                    <div class="flex items-center gap-3 text-xs font-medium">
                        <span class="flex items-center gap-1">
                            <span class="w-3 h-3 bg-red-500 rounded ring-2 ring-red-300"></span> Critical Path Activity
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="w-3 h-3 bg-indigo-500 rounded"></span> Standard Activity
                        </span>
                    </div>
                </div>

                <!-- Main Flowchart Workspace -->
                <div class="deptree-canvas flex-1 bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-auto p-6 min-h-[600px]">
                    ${this.renderNetworkFlow(leafTasks)}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    renderNetworkFlow(leafTasks) {
        if (leafTasks.length === 0) {
            return `<div class="p-8 text-center text-slate-400 italic">No activities to display. Add activities in the Grid view.</div>`;
        }

        // Group tasks by Stage for horizontal pipeline alignment
        const stageMap = new Map();
        HARDWARE_STAGES.forEach(stg => stageMap.set(stg, []));
        leafTasks.forEach(t => {
            const stg = t.stage || 'EVT';
            if (!stageMap.has(stg)) stageMap.set(stg, []);
            stageMap.get(stg).push(t);
        });

        // Generate Node Cards per stage
        const columnsHtml = HARDWARE_STAGES.map(stage => {
            const stageTasks = stageMap.get(stage) || [];
            return `
                <div class="stage-flow-column flex-shrink-0 w-72 flex flex-col gap-4">
                    <div class="p-2 bg-slate-800 text-white font-bold text-xs rounded text-center uppercase tracking-wide shadow-sm flex items-center justify-between px-3">
                        <span>${stage} Stage</span>
                        <span class="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[10px]">${stageTasks.length}</span>
                    </div>
                    <div class="space-y-4">
                        ${stageTasks.map(t => this.renderTaskNodeCard(t)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex gap-8 relative z-10 min-w-max pb-12">
                ${columnsHtml}
            </div>
        `;
    }

    renderTaskNodeCard(task) {
        const ws = WORKSTREAMS[task.workstream] || WORKSTREAMS['HW'];
        const statusInfo = STATUS_PILLS[task.status] || STATUS_PILLS['Not Started'];
        const isCritical = task.isCritical;

        const preds = DependencyEngine.parsePredecessors(task.predecessors, this.tasks);
        const predBadges = preds.map(p => `${p.targetTask.wbs}${p.type}${p.lag ? (p.lag > 0 ? '+' + p.lag + 'd' : p.lag + 'd') : ''}`).join(', ');

        return `
            <div data-node-id="${task.id}" class="task-node-card bg-white p-3 rounded-lg border-2 ${isCritical ? 'border-red-500 ring-2 ring-red-200 shadow-md' : 'border-slate-200 shadow-sm'} hover:shadow-lg transition-all space-y-2 relative">
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="px-1.5 py-0.5 ${isCritical ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'} rounded font-mono text-[10px] font-bold">
                            ${task.wbs}
                        </span>
                        <h4 class="font-bold text-xs text-slate-800 leading-snug truncate max-w-[150px]" title="${this.escapeHtml(task.name)}">
                            ${this.escapeHtml(task.name)}
                        </h4>
                    </div>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0" style="background-color: ${ws.bg}; color: ${ws.color};">
                        ${task.workstream}
                    </span>
                </div>

                <!-- Dates & Assigned Engineer -->
                <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-mono">
                    <div><span class="text-slate-400">Dur:</span> <span class="font-bold text-slate-800">${task.duration}d</span></div>
                    <div><span class="text-slate-400">Lead:</span> <span class="font-bold text-amber-700">${task.leadTime || 0}d</span></div>
                    <div><span class="text-slate-400">Start:</span> ${task.start || '-'}</div>
                    <div><span class="text-slate-400">End:</span> ${task.finish || '-'}</div>
                </div>

                <!-- Engineer & Predecessors -->
                <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span class="font-medium text-slate-700 truncate" title="Assigned: ${this.escapeHtml(task.getFormattedAssignments())}">
                        👤 ${this.escapeHtml(task.getFormattedAssignments())}
                    </span>
                    ${predBadges ? `
                        <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono font-bold text-[9px]" title="Predecessors: ${predBadges}">
                            ← ${predBadges}
                        </span>
                    ` : ''}
                </div>

                <!-- Status Pill -->
                <div class="flex justify-between items-center pt-1">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${statusInfo.class}">
                        ${statusInfo.label}
                    </span>
                    ${isCritical ? `
                        <span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold">Critical</span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}

