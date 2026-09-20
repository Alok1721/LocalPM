/**
 * Calendar Model: Working Days, Festive Holidays & Overtime Exception Dates
 */

export class ProjectCalendar {
    constructor(data = {}) {
        // Standard working days (0 = Sun, 1 = Mon, ..., 6 = Sat). Default: Mon-Fri (1, 2, 3, 4, 5)
        this.workingDays = Array.isArray(data.workingDays) ? data.workingDays : [1, 2, 3, 4, 5];

        // List of festive/company holidays: [{ date: 'YYYY-MM-DD', name: 'Holiday Name' }]
        this.holidays = Array.isArray(data.holidays) ? data.holidays : [
            { date: '2026-10-02', name: 'Gandhi Jayanti' },
            { date: '2026-12-25', name: 'Christmas Day' },
            { date: '2027-01-01', name: 'New Year\'s Day' }
        ];

        // Overtime/Exception working days (e.g. crunch Saturday): [{ date: 'YYYY-MM-DD', note: 'EVT Build Saturday' }]
        this.overtimeDays = Array.isArray(data.overtimeDays) ? data.overtimeDays : [];
    }
}

