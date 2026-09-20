/**
 * Resource View: Engineer Pool Management & Fractional Workload Allocation Heatmap Inspector
 */

import { WORKSTREAMS } from '../models/taskModel.js';
import { Resource } from '../models/resourceModel.js';

export class ResourceView {
    constructor(containerElement, onResourceChange) {
        this.container = containerElement;
        this.onResourceChange = onResourceChange;
    }

    render(resources, tasks) {
        if (!this.container) return;

        this.resources = resources || [];
        this.tasks = tasks || [];

        const html = `
            <div class="resource-view flex flex-col h-full bg-slate-50 overflow-auto p-4 select-none">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                            Team Engineers & Workload Allocation Heatmap
                        </h2>
                        <p class="text-xs text-slate-500">Manage engineer assignments and inspect daily fractional capacity loading to spot over-allocation bottlenecks.</p>
                    </div>
                    <button id="btn-add-engineer" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs shadow transition flex items-center gap-1">
                        + Add Engineer
                    </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                    <!-- Left: Engineers Pool Table -->
                    <div class="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-3 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wide flex justify-between items-center">
                            <span>Team Resource Pool</span>
                            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px]">${this.resources.length} Members</span>
                        </div>
                        <div class="p-3 flex-1 overflow-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                    <tr>
                                        <th class="p-2">Engineer Name</th>
                                        <th class="p-2">Role</th>
                                        <th class="p-2">Stream</th>
                                        <th class="p-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${this.resources.map(r => {
                                        const ws = WORKSTREAMS[r.workstream] || WORKSTREAMS['HW'];
                                        return `
                                            <tr class="hover:bg-slate-50">
                                                <td class="p-2 font-bold text-slate-800">${this.escapeHtml(r.name)}</td>
                                                <td class="p-2 text-slate-600">${this.escapeHtml(r.role)}</td>
                                                <td class="p-2">
                                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" style="background-color: ${ws.bg}; color: ${ws.color};">
                                                        ${r.workstream}
                                                    </span>
                                                </td>
                                                <td class="p-2 text-center">
                                                    <button data-action="delete-resource" data-id="${r.id}" class="text-red-500 hover:text-red-700 font-bold text-xs">✕</button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right: Fractional Workload Heatmap Matrix -->
                    <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-3 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wide flex justify-between items-center">
                            <span>Engineer Daily Workload Heatmap (% Fractional Loading)</span>
                            <div class="flex items-center gap-2 text-[10px]">
                                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-emerald-200 rounded"></span> ≤100% Normal</span>
                                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-red-500 rounded"></span> >100% Over-Allocated</span>
                            </div>
                        </div>
                        <div class="flex-1 overflow-auto">
                            ${this.renderHeatmapMatrix(this.resources, this.tasks)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    renderHeatmapMatrix(resources, tasks) {
        const dates = [];
        let curr = new Date();
        curr.setDate(curr.getDate() - 2);

        for (let i = 0; i < 21; i++) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        // Map fractional workload per resource per date: resourceId_date -> sum of allocation units %
        const workloadMap = new Map();

        tasks.forEach(task => {
            if (!task.start || !task.finish) return;
            const assigned = task.getAssignedResources();
            if (assigned.length === 0) return;

            assigned.forEach(a => {
                const res = resources.find(r => r.name === a.name || r.id === a.name);
                if (!res) return;

                const units = typeof a.units === 'number' ? a.units : 100;
                let d = new Date(task.start);
                const finishDate = new Date(task.finish);

                while (d <= finishDate) {
                    const dateStr = d.toISOString().split('T')[0];
                    const key = `${res.id}_${dateStr}`;
                    const currentLoad = workloadMap.get(key) || 0;
                    workloadMap.set(key, currentLoad + units);
                    d.setDate(d.getDate() + 1);
                }
            });
        });

        return `
            <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                        <th class="p-2 border-r border-slate-200 min-w-[120px] bg-slate-100">Engineer</th>
                        ${dates.map(d => {
                            const dateObj = new Date(d);
                            const dayNum = dateObj.getDate();
                            const monthShort = dateObj.toLocaleString('default', { month: 'short' });
                            return `<th class="p-1 text-center border-r border-slate-200 min-w-[36px] text-[10px]">${monthShort}<br>${dayNum}</th>`;
                        }).join('')}
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${resources.map(res => `
                        <tr>
                            <td class="p-2 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                                ${this.escapeHtml(res.name)}
                            </td>
                            ${dates.map(d => {
                                const key = `${res.id}_${d}`;
                                const load = workloadMap.get(key) || 0;

                                let bgClass = 'bg-white text-slate-300';
                                if (load > 0 && load <= 100) {
                                    bgClass = 'bg-emerald-100 text-emerald-800 font-bold';
                                } else if (load > 100) {
                                    bgClass = 'bg-red-500 text-white font-extrabold shadow-inner';
                                }

                                return `
                                    <td class="p-1 text-center border-r border-slate-200 ${bgClass} text-[10px]" title="${res.name}: ${load}% total allocation on ${d}">
                                        ${load > 0 ? `${load}%` : '-'}
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    attachEventListeners() {
        if (!this.container) return;

        const addBtn = this.container.querySelector('#btn-add-engineer');
        if (addBtn) {
            addBtn.onclick = () => {
                const name = prompt('Enter Engineer Name:');
                if (name && name.trim()) {
                    const role = prompt('Enter Engineer Role (e.g. Lead Firmware Engineer):') || 'Project Engineer';
                    const newRes = new Resource({
                        name: name.trim(),
                        role: role.trim(),
                        workstream: 'HW'
                    });
                    this.resources.push(newRes);
                    if (this.onResourceChange) this.onResourceChange(this.resources);
                    this.render(this.resources, this.tasks);
                }
            };
        }

        this.container.querySelectorAll('[data-action="delete-resource"]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                this.resources = this.resources.filter(r => r.id !== id);
                if (this.onResourceChange) this.onResourceChange(this.resources);
                this.render(this.resources, this.tasks);
            };
        });
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}
