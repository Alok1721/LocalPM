/**
 * Info & Guide View: Glossary of Abbreviations, Acronyms & Interactive User Manual
 */

export class InfoGuideView {
    constructor(containerElement) {
        this.container = containerElement;
    }

    render() {
        if (!this.container) return;

        const html = `
            <div class="info-guide-view flex flex-col h-full bg-slate-50 overflow-auto p-4 select-none">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Project Management Tool - Glossary of Abbreviations & User Manual
                        </h2>
                        <p class="text-xs text-slate-500">Quick reference guide explaining project terminology, stage gates, workstreams, and scheduling tools.</p>
                    </div>
                </div>

                <div class="space-y-6 flex-1 pb-8">
                    <!-- SECTION 1: GLOSSARY OF ABBREVIATIONS -->
                    <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div class="p-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                            <span>📖 1. Glossary of Abbreviations & Terminology</span>
                        </div>
                        
                        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
                            
                            <!-- Column A: Scheduling & CPM -->
                            <div class="space-y-3">
                                <h4 class="font-bold text-indigo-900 border-b border-slate-200 pb-1 uppercase tracking-wide">Scheduling & CPM Terminology</h4>
                                <ul class="space-y-2">
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">WBS</strong>: <em>Work Breakdown Structure</em>. Hierarchy numbering (e.g. 1.1.2) representing task depth.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">CPM</strong>: <em>Critical Path Method</em>. The longest sequence of dependent tasks determining project finish date.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">FS</strong>: <em>Finish-to-Start</em> dependency. Task B starts after Task A finishes.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">SS</strong>: <em>Start-to-Start</em> dependency. Task B starts when Task A starts.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">FF</strong>: <em>Finish-to-Finish</em> dependency. Task B finishes when Task A finishes.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">SF</strong>: <em>Start-to-Finish</em> dependency. Task B finishes when Task A starts.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">Lag / Lead</strong>: Delay (+N days) or overlap (-N days) added to dependency links (e.g. <code>2FS+3d</code>).</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">Baseline</strong>: Saved target snapshot used to measure schedule variance and delay drift.</li>
                                </ul>
                            </div>

                            <!-- Column B: Project Stages -->
                            <div class="space-y-3">
                                <h4 class="font-bold text-indigo-900 border-b border-slate-200 pb-1 uppercase tracking-wide">Project Development Stages</h4>
                                <ul class="space-y-2">
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">Concept</strong>: Initial product architecture, BOM costing, and feasibility phase.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">EVT</strong>: <em>Engineering Verification Test</em>. First working prototype board spin & basic bring-up.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">DVT</strong>: <em>Design Verification Test</em>. Enclosure tooling, compliance testing, and RF optimization.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">PVT</strong>: <em>Production Verification Test</em>. Pilot production run on manufacturing lines.</li>
                                    <li><strong class="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">MP</strong>: <em>Mass Production</em>. Full volume manufacturing and market release gate.</li>
                                </ul>
                            </div>

                            <!-- Column C: Workstream Disciplines -->
                            <div class="space-y-3">
                                <h4 class="font-bold text-indigo-900 border-b border-slate-200 pb-1 uppercase tracking-wide">Workstream Disciplines</h4>
                                <ul class="space-y-2">
                                    <li><strong class="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">HW</strong>: Hardware / System Engineering</li>
                                    <li><strong class="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">EE</strong>: Electronics / PCB Schematic & Layout</li>
                                    <li><strong class="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">ME</strong>: Mechanical / 3D CAD & Enclosure Tooling</li>
                                    <li><strong class="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">FW</strong>: Firmware / Embedded Software Architecture</li>
                                    <li><strong class="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">SYS</strong>: System Engineering & Integration</li>
                                    <li><strong class="font-mono text-pink-700 bg-pink-50 px-1 py-0.5 rounded">PROC</strong>: Procurement & Vendor Component Fab</li>
                                    <li><strong class="font-mono text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded">TEST</strong>: Pre-compliance & QA Reliability Testing</li>
                                    <li><strong class="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">MFG</strong>: Manufacturing Assembly & Line Setup</li>
                                </ul>
                            </div>

                        </div>
                    </div>

                    <!-- SECTION 2: USER MANUAL & TOOL GUIDE -->
                    <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div class="p-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                            <span>🚀 2. Step-by-Step User Manual & Tool Guide</span>
                        </div>

                        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                            
                            <!-- Guide Card 1 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                                    Task Management & WBS Hierarchy
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    Click <strong>Add Activity</strong> to create tasks. Select a row and click <strong>Indent</strong> to turn a task into a child subtask underneath a parent <strong>Summary Task</strong>. Tasks with <code>0</code> duration automatically render as <strong>Milestone Diamonds</strong>.
                                </p>
                            </div>

                            <!-- Guide Card 2 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                                    Predecessors & Auto-Scheduling
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    In the Predecessor column, enter predecessor links like <code>1FS</code>, <code>2SS+3d</code>, or <code>4FF-1d</code>. The schedule engine automatically recalculates downstream task start and finish dates.
                                </p>
                            </div>

                            <!-- Guide Card 3 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                                    Bidirectional Gantt Chart Drag & Drop
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    Drag the body of any Gantt task bar left or right to translate start/finish dates. Drag the right edge handle to extend duration. Edits instantly sync with the WBS Grid table.
                                </p>
                            </div>

                            <!-- Guide Card 4 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">4</span>
                                    Custom Calendar, Holidays & Overtime
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    Click <strong>Calendar</strong> in the top header to configure standard weekly working days, add festive holidays, or define overtime working days. The schedule engine automatically accounts for off days.
                                </p>
                            </div>

                            <!-- Guide Card 5 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">5</span>
                                    Engineer Workload & Over-Allocation
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    Assign team engineers in the WBS Grid, then switch to the <strong>Engineer Workload</strong> tab to inspect daily capacity loading. Overallocated dates (>100%) are highlighted in red.
                                </p>
                            </div>

                            <!-- Guide Card 6 -->
                            <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <h4 class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span class="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">6</span>
                                    File Persistence & Excel Export
                                </h4>
                                <p class="text-slate-600 leading-relaxed">
                                    Save your full project state to a <code>.prj</code> file using <strong>Save (.prj)</strong>, or export a multi-tab schedule to Microsoft Excel using <strong>Excel Export</strong>.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        `;

        this.container.innerHTML = html;
    }
}

