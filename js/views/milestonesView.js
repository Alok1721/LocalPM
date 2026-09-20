/**
 * Milestones View: Executive Hardware Deliverables Roadmap & Baseline Comparison Board
 */

import { HARDWARE_STAGES, WORKSTREAMS, STATUS_PILLS } from '../models/taskModel.js';
import { BaselineEngine } from '../engine/baselineEngine.js';

export class MilestonesView {
    constructor(containerElement) {
        this.container = containerElement;
    }

    render(tasks) {
        if (!this.container) return;

        // Filter milestones (tasks with isMilestone = true or duration = 0)
        const milestones = tasks.filter(t => t.isMilestone || t.duration === 0);

        const html = `
            <div class="milestones-view flex flex-col h-full bg-slate-50 overflow-auto p-4 select-none">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
                            <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>
                            Deliverables & Milestone Roadmap
                        </h2>
                        <p class="text-xs text-slate-500">Executive summary of stage gates and baseline schedule variance.</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded font-semibold">Total Milestones: ${milestones.length}</span>
                    </div>
                </div>

                <!-- Stages Pipeline -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                    ${HARDWARE_STAGES.map(stage => this.renderStageColumn(stage, milestones)).join('')}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    renderStageColumn(stage, milestones) {
        const stageMilestones = milestones.filter(m => m.stage === stage);
        
        return `
            <div class="stage-column flex flex-col bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                <!-- Stage Header -->
                <div class="p-2.5 bg-slate-200 border-b border-slate-300 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>${stage} Gate</span>
                    <span class="px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded text-[10px]">${stageMilestones.length}</span>
                </div>

                <!-- Stage Cards -->
                <div class="p-2 flex-1 overflow-auto space-y-2">
                    ${stageMilestones.length === 0 ? `
                        <div class="p-3 text-center text-slate-400 text-xs italic">No milestones defined</div>
                    ` : stageMilestones.map(m => this.renderMilestoneCard(m)).join('')}
                </div>
            </div>
        `;
    }

    renderMilestoneCard(m) {
        const ws = WORKSTREAMS[m.workstream] || WORKSTREAMS['HW'];
        const statusInfo = STATUS_PILLS[m.status] || STATUS_PILLS['Not Started'];
        const variance = BaselineEngine.getVariance(m);

        return `
            <div class="milestone-card bg-white p-3 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-2">
                <div class="flex items-start justify-between gap-1">
                    <span class="font-semibold text-xs text-slate-800 leading-snug">
                        ${this.escapeHtml(m.name)}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" style="background-color: ${ws.bg}; color: ${ws.color};">
                        ${m.workstream}
                    </span>
                </div>

                <!-- Target & Baseline Dates -->
                <div class="text-[11px] text-slate-600 space-y-0.5 font-mono">
                    <div class="flex justify-between">
                        <span class="text-slate-400">Target:</span>
                        <span class="font-bold text-slate-800">${m.finish || m.start}</span>
                    </div>
                    ${m.baseline && m.baseline.finish ? `
                        <div class="flex justify-between text-[10px]">
                            <span class="text-slate-400">Baseline:</span>
                            <span class="text-slate-500 line-through">${m.baseline.finish}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Status & Variance -->
                <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span class="px-1.5 py-0.5 rounded font-medium border ${statusInfo.class}">
                        ${statusInfo.label}
                    </span>
                    <span class="px-1.5 py-0.5 rounded font-bold ${variance.badgeClass}">
                        ${variance.statusText}
                    </span>
                </div>
            </div>
        `;
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}

