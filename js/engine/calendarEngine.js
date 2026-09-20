/**
 * Calendar Engine: Evaluates working days, holidays, and overtime days for task scheduling
 */

import { ProjectCalendar } from '../models/calendarModel.js';

export class CalendarEngine {

    /**
     * Check if a specific date string (YYYY-MM-DD) is a valid working day
     */
    static isWorkingDay(dateStr, calendar = new ProjectCalendar()) {
        if (!dateStr) return false;
        
        // 1. Check if explicitly marked as Overtime Working Day
        if (calendar.overtimeDays && calendar.overtimeDays.some(o => o.date === dateStr)) {
            return true;
        }

        // 2. Check if explicitly marked as Festive / Company Holiday
        if (calendar.holidays && calendar.holidays.some(h => h.date === dateStr)) {
            return false;
        }

        // 3. Check standard weekly working days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const workingDays = calendar.workingDays || [1, 2, 3, 4, 5];

        return workingDays.includes(dayOfWeek);
    }

    /**
     * Get Holiday Info for a date if it exists
     */
    static getHoliday(dateStr, calendar = new ProjectCalendar()) {
        if (!calendar || !calendar.holidays) return null;
        return calendar.holidays.find(h => h.date === dateStr) || null;
    }

    /**
     * Get Overtime Working Day Info if it exists
     */
    static getOvertime(dateStr, calendar = new ProjectCalendar()) {
        if (!calendar || !calendar.overtimeDays) return null;
        return calendar.overtimeDays.find(o => o.date === dateStr) || null;
    }

    /**
     * Add N working days to a start date string (YYYY-MM-DD) respecting calendar
     */
    static addWorkingDays(startDateStr, days, calendar = new ProjectCalendar()) {
        if (!startDateStr) return '';
        if (days <= 0) return startDateStr;

        let date = new Date(startDateStr);
        let count = 0;

        while (count < days - 1) {
            date.setDate(date.getDate() + 1);
            const dateStr = date.toISOString().split('T')[0];
            if (this.isWorkingDay(dateStr, calendar)) {
                count++;
            }
        }
        return date.toISOString().split('T')[0];
    }

    /**
     * Calculate count of working days between start and finish dates (inclusive)
     */
    static getWorkingDays(startDateStr, endDateStr, calendar = new ProjectCalendar()) {
        if (!startDateStr || !endDateStr) return 1;
        let start = new Date(startDateStr);
        let end = new Date(endDateStr);
        if (start > end) return 1;

        let count = 0;
        let current = new Date(start);

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            if (this.isWorkingDay(dateStr, calendar)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return Math.max(1, count);
    }
}

