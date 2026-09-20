/**
 * Calendar Modal View: Configures Weekly Off Days, Festive Holidays & Overtime Working Days
 */

export class CalendarModalView {
    constructor(modalContainer, onCalendarChange) {
        this.container = modalContainer;
        this.onCalendarChange = onCalendarChange;
        this.calendar = null;
    }

    render(calendar) {
        if (!this.container) return;
        this.calendar = calendar;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const html = `
            <div id="calendar-modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
                    
                    <!-- Modal Header -->
                    <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            <h3 class="font-bold text-base">Project Calendar & Working Days Config</h3>
                        </div>
                        <button id="modal-close-btn" class="text-slate-400 hover:text-white transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-6 space-y-6 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
                        
                        <!-- 1. Weekly Off / Working Days -->
                        <div class="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                📅 Standard Weekly Working Days
                            </h4>
                            <p class="text-slate-500 text-[11px]">Select standard working days for task scheduling (unchecked days are weekly offs):</p>
                            
                            <div class="grid grid-cols-2 md:grid-cols-7 gap-2 pt-2">
                                ${dayNames.map((name, idx) => {
                                    const isChecked = (this.calendar.workingDays || [1,2,3,4,5]).includes(idx);
                                    return `
                                        <label class="flex items-center gap-1.5 p-2 rounded border ${isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' : 'bg-white border-slate-200 text-slate-500'} cursor-pointer transition">
                                            <input type="checkbox" data-day="${idx}" ${isChecked ? 'checked' : ''} class="weekly-day-checkbox rounded text-indigo-600 focus:ring-indigo-500">
                                            <span>${name.substr(0,3)}</span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- 2. Festive & Company Holidays -->
                        <div class="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                🌴 Festive & Company Holidays
                            </h4>
                            <p class="text-slate-500 text-[11px]">Tasks will automatically skip these non-working dates:</p>

                            <!-- Add Holiday Form -->
                            <div class="flex items-center gap-2 pt-1">
                                <input type="date" id="new-holiday-date" class="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500">
                                <input type="text" id="new-holiday-name" placeholder="Holiday Name (e.g. Diwali)" class="flex-1 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500">
                                <button id="btn-add-holiday" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-sm transition">
                                    + Add Holiday
                                </button>
                            </div>

                            <!-- Holidays Table -->
                            <div class="border border-slate-200 rounded overflow-hidden bg-white max-h-36 overflow-y-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                                        <tr>
                                            <th class="p-2 border-r border-slate-200">Date</th>
                                            <th class="p-2 border-r border-slate-200">Holiday Name</th>
                                            <th class="p-2 w-12 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        ${(this.calendar.holidays || []).length === 0 ? `
                                            <tr><td colspan="3" class="p-3 text-center text-slate-400 italic">No holidays configured</td></tr>
                                        ` : (this.calendar.holidays || []).map((h, i) => `
                                            <tr class="hover:bg-slate-50">
                                                <td class="p-2 font-mono font-bold text-slate-800 border-r border-slate-100">${h.date}</td>
                                                <td class="p-2 border-r border-slate-100">${this.escapeHtml(h.name)}</td>
                                                <td class="p-2 text-center">
                                                    <button data-action="delete-holiday" data-index="${i}" class="text-red-600 hover:text-red-800 font-bold">✕</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- 3. Overtime Exception Working Days -->
                        <div class="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                ⚡ Overtime / Weekend Working Days
                            </h4>
                            <p class="text-slate-500 text-[11px]">Specify weekend/off dates where overtime work takes place (e.g. EVT build Saturday):</p>

                            <!-- Add Overtime Form -->
                            <div class="flex items-center gap-2 pt-1">
                                <input type="date" id="new-overtime-date" class="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500">
                                <input type="text" id="new-overtime-note" placeholder="Note (e.g. EVT Spin Crunch Saturday)" class="flex-1 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500">
                                <button id="btn-add-overtime" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-sm transition">
                                    + Add Overtime
                                </button>
                            </div>

                            <!-- Overtime Table -->
                            <div class="border border-slate-200 rounded overflow-hidden bg-white max-h-36 overflow-y-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-amber-50 border-b border-amber-200 font-semibold text-amber-900">
                                        <tr>
                                            <th class="p-2 border-r border-amber-200">Date</th>
                                            <th class="p-2 border-r border-amber-200">Note / Reason</th>
                                            <th class="p-2 w-12 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        ${(this.calendar.overtimeDays || []).length === 0 ? `
                                            <tr><td colspan="3" class="p-3 text-center text-slate-400 italic">No overtime days configured</td></tr>
                                        ` : (this.calendar.overtimeDays || []).map((o, i) => `
                                            <tr class="hover:bg-amber-50/50">
                                                <td class="p-2 font-mono font-bold text-amber-900 border-r border-slate-100">${o.date}</td>
                                                <td class="p-2 border-r border-slate-100">${this.escapeHtml(o.note)}</td>
                                                <td class="p-2 text-center">
                                                    <button data-action="delete-overtime" data-index="${i}" class="text-red-600 hover:text-red-800 font-bold">✕</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    <!-- Modal Footer -->
                    <div class="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                        <span class="text-[11px] text-slate-500">Changes update project scheduling instantly.</span>
                        <button id="modal-save-btn" class="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow transition">
                            Apply Calendar Changes
                        </button>
                    </div>

                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    attachEventListeners() {
        if (!this.container) return;

        const closeBtn = this.container.querySelector('#modal-close-btn');
        const saveBtn = this.container.querySelector('#modal-save-btn');
        const backdrop = this.container.querySelector('#calendar-modal-backdrop');

        const closeModal = () => {
            this.container.innerHTML = '';
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        if (backdrop) {
            backdrop.onclick = (e) => {
                if (e.target === backdrop) closeModal();
            };
        }

        // Apply changes
        if (saveBtn) {
            saveBtn.onclick = () => {
                // Collect selected weekly working days
                const selectedDays = [];
                this.container.querySelectorAll('.weekly-day-checkbox').forEach(cb => {
                    if (cb.checked) {
                        selectedDays.push(parseInt(cb.getAttribute('data-day'), 10));
                    }
                });

                this.calendar.workingDays = selectedDays;

                if (this.onCalendarChange) {
                    this.onCalendarChange(this.calendar);
                }
                closeModal();
            };
        }

        // Add Holiday button
        const addHolidayBtn = this.container.querySelector('#btn-add-holiday');
        if (addHolidayBtn) {
            addHolidayBtn.onclick = () => {
                const dateInput = this.container.querySelector('#new-holiday-date');
                const nameInput = this.container.querySelector('#new-holiday-name');
                if (dateInput && nameInput && dateInput.value && nameInput.value.trim()) {
                    this.calendar.holidays.push({
                        date: dateInput.value,
                        name: nameInput.value.trim()
                    });
                    this.render(this.calendar);
                }
            };
        }

        // Delete Holiday button
        this.container.querySelectorAll('[data-action="delete-holiday"]').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                this.calendar.holidays.splice(idx, 1);
                this.render(this.calendar);
            };
        });

        // Add Overtime button
        const addOvertimeBtn = this.container.querySelector('#btn-add-overtime');
        if (addOvertimeBtn) {
            addOvertimeBtn.onclick = () => {
                const dateInput = this.container.querySelector('#new-overtime-date');
                const noteInput = this.container.querySelector('#new-overtime-note');
                if (dateInput && noteInput && dateInput.value && noteInput.value.trim()) {
                    this.calendar.overtimeDays.push({
                        date: dateInput.value,
                        note: noteInput.value.trim()
                    });
                    this.render(this.calendar);
                }
            };
        }

        // Delete Overtime button
        this.container.querySelectorAll('[data-action="delete-overtime"]').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                this.calendar.overtimeDays.splice(idx, 1);
                this.render(this.calendar);
            };
        });
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}

