/**
 * Print Engine: Targeted print styles and PDF export for individual views (Gantt-only, WBS-only, Milestones-only)
 */

export class PrintEngine {

    static printView(target = 'all') {
        const body = document.body;

        // Remove existing print class modifiers
        body.classList.remove('print-gantt-only', 'print-wbs-only', 'print-milestones-only');

        if (target === 'gantt') {
            body.classList.add('print-gantt-only');
        } else if (target === 'wbs') {
            body.classList.add('print-wbs-only');
        } else if (target === 'milestones') {
            body.classList.add('print-milestones-only');
        }

        // Trigger browser native print / PDF save dialog
        setTimeout(() => {
            window.print();
            // Clean up after print dialog closes
            setTimeout(() => {
                body.classList.remove('print-gantt-only', 'print-wbs-only', 'print-milestones-only');
            }, 500);
        }, 100);
    }
}

