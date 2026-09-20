/**
 * Resource Model & Default Engineers Pool
 */

export class Resource {
    constructor(data = {}) {
        this.id = data.id || 'res_' + Math.random().toString(36).substr(2, 9);
        this.name = data.name || 'New Engineer';
        this.role = data.role || 'Hardware Engineer';
        this.workstream = data.workstream || 'HW'; // HW, EE, ME, FW, PROC, TEST
        this.capacity = typeof data.capacity === 'number' ? data.capacity : 100; // % capacity (100 = 8h/day)
    }
}

export const DEFAULT_RESOURCES = [
    new Resource({ id: 'res_1', name: 'Alex Rivera', role: 'Lead PCB Engineer', workstream: 'EE', capacity: 100 }),
    new Resource({ id: 'res_2', name: 'Sarah Chen', role: 'Firmware Architect', workstream: 'FW', capacity: 100 }),
    new Resource({ id: 'res_3', name: 'Marcus Vance', role: 'Industrial & Mechanical Lead', workstream: 'ME', capacity: 100 }),
    new Resource({ id: 'res_4', name: 'Priya Sharma', role: 'Hardware System Lead', workstream: 'HW', capacity: 100 }),
    new Resource({ id: 'res_5', name: 'David Kim', role: 'Procurement Specialist', workstream: 'PROC', capacity: 100 }),
    new Resource({ id: 'res_6', name: 'Elena Rostova', role: 'QA & Compliance Lead', workstream: 'TEST', capacity: 100 })
];

