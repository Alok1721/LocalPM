/**
 * Excel Exporter Module: Multi-tab Excel (.xlsx) / CSV export including Tasks, Milestones, Resources, and Calendar
 */

import { BaselineEngine } from '../engine/baselineEngine.js';

export class ExcelExporter {

    static exportToExcel(projectTitle, tasks, resources = [], calendar = {}) {
        if (!window.XLSX) {
            alert('SheetJS Excel library not loaded. Falling back to CSV export.');
            this.exportToCSV(projectTitle, tasks);
            return;
        }

        const wb = window.XLSX.utils.book_new();

        // Sheet 1: WBS Task Sheet
        const wbsData = tasks.map(t => ({
            'WBS': t.wbs,
            'Activity Name': t.name,
            'Workstream': t.workstream,
            'Hardware Stage': t.stage,
            'Assigned Engineers': t.getFormattedAssignments(),
            'Status': t.status,
            'Duration (Days)': t.duration,
            'Start Date': t.start,
            'Finish Date': t.finish,
            'Predecessors': t.predecessors || '',
            'Procurement Lead (Days)': t.leadTime || 0,
            'Vendor': t.vendor || '',
            'Progress (%)': t.progress || 0,
            'Is Milestone': t.isMilestone ? 'YES' : 'NO'
        }));

        const wsWbs = window.XLSX.utils.json_to_sheet(wbsData);
        window.XLSX.utils.book_append_sheet(wb, wsWbs, 'WBS Tasks');

        // Sheet 2: Milestones & Gates
        const milestones = tasks.filter(t => t.isMilestone || t.duration === 0);
        const milestoneData = milestones.map(m => {
            const v = BaselineEngine.getVariance(m);
            return {
                'WBS': m.wbs,
                'Milestone Name': m.name,
                'Hardware Stage': m.stage,
                'Workstream': m.workstream,
                'Assigned Engineer': m.assignedTo || 'Unassigned',
                'Target Date': m.finish || m.start,
                'Baseline Date': (m.baseline && m.baseline.finish) || 'N/A',
                'Variance': v.statusText,
                'Status': m.status
            };
        });

        const wsMilestones = window.XLSX.utils.json_to_sheet(milestoneData);
        window.XLSX.utils.book_append_sheet(wb, wsMilestones, 'Milestones');

        // Sheet 3: Resource Pool
        const resData = resources.map(r => ({
            'Resource ID': r.id,
            'Engineer Name': r.name,
            'Role': r.role,
            'Primary Workstream': r.workstream,
            'Capacity (%)': r.capacity
        }));

        const wsRes = window.XLSX.utils.json_to_sheet(resData);
        window.XLSX.utils.book_append_sheet(wb, wsRes, 'Team Resources');

        // Sheet 4: Project Calendar & Holidays
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const workingDayNames = (calendar.workingDays || [1,2,3,4,5]).map(d => dayNames[d]).join(', ');

        const calendarData = [
            { 'Config Type': 'Standard Weekly Working Days', 'Details': workingDayNames },
            ... (calendar.holidays || []).map(h => ({ 'Config Type': 'Festive / Company Holiday', 'Details': `${h.date}: ${h.name}` })),
            ... (calendar.overtimeDays || []).map(o => ({ 'Config Type': 'Overtime Working Day', 'Details': `${o.date}: ${o.note}` }))
        ];

        const wsCal = window.XLSX.utils.json_to_sheet(calendarData);
        window.XLSX.utils.book_append_sheet(wb, wsCal, 'Project Calendar');

        // Download Excel File
        const fileName = `${(projectTitle || 'Hardware_Project').replace(/[^a-z0-9_-]/gi, '_')}.xlsx`;
        window.XLSX.writeFile(wb, fileName);
    }

    static exportToCSV(projectTitle, tasks) {
        const headers = ['WBS', 'Activity Name', 'Workstream', 'Stage', 'Assigned Engineer', 'Status', 'Duration', 'Start', 'Finish', 'Predecessors', 'LeadTime', 'Progress'];
        const rows = tasks.map(t => [
            `"${t.wbs}"`,
            `"${t.name.replace(/"/g, '""')}"`,
            `"${t.workstream}"`,
            `"${t.stage}"`,
            `"${t.assignedTo || ''}"`,
            `"${t.status}"`,
            t.duration,
            `"${t.start}"`,
            `"${t.finish}"`,
            `"${(t.predecessors || '').replace(/"/g, '""')}"`,
            t.leadTime || 0,
            t.progress || 0
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(projectTitle || 'Hardware_Project').replace(/[^a-z0-9_-]/gi, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
