(() => {
  // js/models/taskModel.js
  var Task = class {
    constructor(data = {}) {
      this.id = data.id || "task_" + Math.random().toString(36).substr(2, 9);
      this.wbs = data.wbs || "1";
      this.name = data.name || "New Activity";
      this.duration = typeof data.duration === "number" ? data.duration : 1;
      this.start = data.start || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      this.finish = data.finish || this.calculateFinishDate(this.start, this.duration);
      this.predecessors = data.predecessors || "";
      this.progress = typeof data.progress === "number" ? data.progress : 0;
      this.stage = data.stage || "EVT";
      this.workstream = data.workstream || "HW";
      this.status = data.status || "Not Started";
      this.isMilestone = Boolean(data.isMilestone) || this.duration === 0;
      this.isSummary = Boolean(data.isSummary) || false;
      this.parentId = data.parentId || null;
      this.expanded = data.expanded !== void 0 ? data.expanded : true;
      this.leadTime = data.leadTime || 0;
      this.vendor = data.vendor || "";
      if (Array.isArray(data.assignedResources)) {
        this.assignedResources = data.assignedResources.map((r) => ({
          name: r.name,
          units: typeof r.units === "number" ? r.units : 100
        }));
      } else if (data.assignedTo && typeof data.assignedTo === "string") {
        this.assignedResources = [{ name: data.assignedTo, units: 100 }];
      } else {
        this.assignedResources = [];
      }
      this.assignedTo = data.assignedTo || (this.assignedResources.length > 0 ? this.assignedResources[0].name : "");
      this.notes = data.notes || "";
      this.baseline = data.baseline ? {
        start: data.baseline.start,
        finish: data.baseline.finish,
        duration: data.baseline.duration
      } : null;
      this.earlyStart = null;
      this.earlyFinish = null;
      this.lateStart = null;
      this.lateFinish = null;
      this.slack = 0;
      this.isCritical = false;
    }
    calculateFinishDate(startDateStr, durationDays) {
      if (!startDateStr) return "";
      const date = new Date(startDateStr);
      let added = 0;
      const days = Math.max(1, durationDays);
      while (added < days - 1) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          added++;
        }
      }
      return date.toISOString().split("T")[0];
    }
    /**
     * Get array of assigned resources
     */
    getAssignedResources() {
      if (Array.isArray(this.assignedResources) && this.assignedResources.length > 0) {
        return this.assignedResources;
      }
      if (this.assignedTo) {
        return [{ name: this.assignedTo, units: 100 }];
      }
      return [];
    }
    /**
     * Format assigned engineers string for labels
     */
    getFormattedAssignments() {
      const list = this.getAssignedResources();
      if (list.length === 0) return "Unassigned";
      return list.map((r) => `${r.name} (${r.units || 100}%)`).join(", ");
    }
  };
  var WORKSTREAMS = {
    "HW": { name: "Hardware / System", color: "#3b82f6", bg: "#dbeafe" },
    "EE": { name: "Electronics / PCB", color: "#8b5cf6", bg: "#ede9fe" },
    "ME": { name: "Mechanical / Enclosure", color: "#f59e0b", bg: "#fef3c7" },
    "FW": { name: "Firmware / Embedded", color: "#10b981", bg: "#d1fae5" },
    "SYS": { name: "System Engineering", color: "#6366f1", bg: "#e0e7ff" },
    "PROC": { name: "Procurement / Fab", color: "#ec4899", bg: "#fce7f3" },
    "TEST": { name: "Compliance / QA", color: "#06b6d4", bg: "#cffaff" },
    "MFG": { name: "Manufacturing / Assembly", color: "#64748b", bg: "#f1f5f9" }
  };
  var HARDWARE_STAGES = ["Concept", "EVT", "DVT", "PVT", "MP"];
  var STATUS_PILLS = {
    "Not Started": { label: "Not Started", class: "bg-slate-100 text-slate-700 border-slate-300" },
    "In Design": { label: "In Design", class: "bg-blue-100 text-blue-700 border-blue-300" },
    "In Fab": { label: "In Fab / Vendor", class: "bg-purple-100 text-purple-700 border-purple-300" },
    "Testing": { label: "Testing / QA", class: "bg-cyan-100 text-cyan-700 border-cyan-300" },
    "Blocked": { label: "Blocked / Risk", class: "bg-amber-100 text-amber-800 border-amber-300" },
    "Delayed": { label: "Delayed", class: "bg-red-100 text-red-700 border-red-300" },
    "Complete": { label: "Complete", class: "bg-emerald-100 text-emerald-700 border-emerald-300" }
  };
  function registerCustomWorkstream(code, name, color = "#6366f1", bg = "#e0e7ff") {
    const safeCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!WORKSTREAMS[safeCode]) {
      WORKSTREAMS[safeCode] = { name: name || safeCode, color, bg };
    }
    return safeCode;
  }
  function registerCustomStage(stageName) {
    const trimmed = stageName.trim();
    if (trimmed && !HARDWARE_STAGES.includes(trimmed)) {
      HARDWARE_STAGES.push(trimmed);
    }
    return trimmed;
  }
  function registerCustomStatus(statusName) {
    const trimmed = statusName.trim();
    if (trimmed && !STATUS_PILLS[trimmed]) {
      STATUS_PILLS[trimmed] = {
        label: trimmed,
        class: "bg-indigo-100 text-indigo-800 border-indigo-300"
      };
    }
    return trimmed;
  }

  // js/models/resourceModel.js
  var Resource = class {
    constructor(data = {}) {
      this.id = data.id || "res_" + Math.random().toString(36).substr(2, 9);
      this.name = data.name || "New Engineer";
      this.role = data.role || "Hardware Engineer";
      this.workstream = data.workstream || "HW";
      this.capacity = typeof data.capacity === "number" ? data.capacity : 100;
    }
  };
  var DEFAULT_RESOURCES = [
    new Resource({ id: "res_1", name: "Alex Rivera", role: "Lead PCB Engineer", workstream: "EE", capacity: 100 }),
    new Resource({ id: "res_2", name: "Sarah Chen", role: "Firmware Architect", workstream: "FW", capacity: 100 }),
    new Resource({ id: "res_3", name: "Marcus Vance", role: "Industrial & Mechanical Lead", workstream: "ME", capacity: 100 }),
    new Resource({ id: "res_4", name: "Priya Sharma", role: "Hardware System Lead", workstream: "HW", capacity: 100 }),
    new Resource({ id: "res_5", name: "David Kim", role: "Procurement Specialist", workstream: "PROC", capacity: 100 }),
    new Resource({ id: "res_6", name: "Elena Rostova", role: "QA & Compliance Lead", workstream: "TEST", capacity: 100 })
  ];

  // js/models/calendarModel.js
  var ProjectCalendar = class {
    constructor(data = {}) {
      this.workingDays = Array.isArray(data.workingDays) ? data.workingDays : [1, 2, 3, 4, 5];
      this.holidays = Array.isArray(data.holidays) ? data.holidays : [
        { date: "2026-10-02", name: "Gandhi Jayanti" },
        { date: "2026-12-25", name: "Christmas Day" },
        { date: "2027-01-01", name: "New Year's Day" }
      ];
      this.overtimeDays = Array.isArray(data.overtimeDays) ? data.overtimeDays : [];
    }
  };

  // js/engine/calendarEngine.js
  var CalendarEngine = class {
    /**
     * Check if a specific date string (YYYY-MM-DD) is a valid working day
     */
    static isWorkingDay(dateStr, calendar = new ProjectCalendar()) {
      if (!dateStr) return false;
      if (calendar.overtimeDays && calendar.overtimeDays.some((o) => o.date === dateStr)) {
        return true;
      }
      if (calendar.holidays && calendar.holidays.some((h) => h.date === dateStr)) {
        return false;
      }
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
      return calendar.holidays.find((h) => h.date === dateStr) || null;
    }
    /**
     * Get Overtime Working Day Info if it exists
     */
    static getOvertime(dateStr, calendar = new ProjectCalendar()) {
      if (!calendar || !calendar.overtimeDays) return null;
      return calendar.overtimeDays.find((o) => o.date === dateStr) || null;
    }
    /**
     * Add N working days to a start date string (YYYY-MM-DD) respecting calendar
     */
    static addWorkingDays(startDateStr, days, calendar = new ProjectCalendar()) {
      if (!startDateStr) return "";
      if (days <= 0) return startDateStr;
      let date = new Date(startDateStr);
      let count = 0;
      while (count < days - 1) {
        date.setDate(date.getDate() + 1);
        const dateStr = date.toISOString().split("T")[0];
        if (this.isWorkingDay(dateStr, calendar)) {
          count++;
        }
      }
      return date.toISOString().split("T")[0];
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
        const dateStr = current.toISOString().split("T")[0];
        if (this.isWorkingDay(dateStr, calendar)) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return Math.max(1, count);
    }
  };

  // js/engine/dependencyEngine.js
  var DependencyEngine = class {
    /**
     * Add working days to a date string using CalendarEngine
     */
    static addWorkingDays(startDateStr, days, calendar) {
      return CalendarEngine.addWorkingDays(startDateStr, days, calendar);
    }
    /**
     * Calculate working days between two dates using CalendarEngine
     */
    static getWorkingDays(startDateStr, endDateStr, calendar) {
      return CalendarEngine.getWorkingDays(startDateStr, endDateStr, calendar);
    }
    /**
     * Update WBS numbers and indent hierarchy for all tasks
     */
    static updateWBSHierarchy(tasks, calendar) {
      const idMap = /* @__PURE__ */ new Map();
      tasks.forEach((t) => idMap.set(t.id, t));
      const childrenMap = /* @__PURE__ */ new Map();
      tasks.forEach((t) => {
        const pid = t.parentId || "root";
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid).push(t);
      });
      function assignWBS(parentId, prefix) {
        const children = childrenMap.get(parentId) || [];
        children.forEach((child, index) => {
          const num = index + 1;
          child.wbs = prefix ? `${prefix}.${num}` : `${num}`;
          const hasChildren = childrenMap.has(child.id) && childrenMap.get(child.id).length > 0;
          child.isSummary = hasChildren;
          if (hasChildren) {
            assignWBS(child.id, child.wbs);
          }
        });
      }
      assignWBS("root", "");
      this.recalculateSummaryTasks(tasks, childrenMap, calendar);
    }
    /**
     * Recalculate summary task dates, duration, and progress from subtasks
     */
    static recalculateSummaryTasks(tasks, childrenMap, calendar) {
      const summaryTasks = tasks.filter((t) => t.isSummary);
      summaryTasks.sort((a, b) => b.wbs.split(".").length - a.wbs.split(".").length);
      summaryTasks.forEach((parent) => {
        const children = childrenMap.get(parent.id) || [];
        if (children.length === 0) return;
        let minStart = null;
        let maxFinish = null;
        let totalWeightedProgress = 0;
        let totalDuration = 0;
        children.forEach((child) => {
          if (child.start) {
            if (!minStart || new Date(child.start) < new Date(minStart)) {
              minStart = child.start;
            }
          }
          if (child.finish) {
            if (!maxFinish || new Date(child.finish) > new Date(maxFinish)) {
              maxFinish = child.finish;
            }
          }
          const dur = Math.max(1, child.duration || 1);
          totalDuration += dur;
          totalWeightedProgress += (child.progress || 0) * dur;
        });
        if (minStart) parent.start = minStart;
        if (maxFinish) parent.finish = maxFinish;
        if (minStart && maxFinish) {
          parent.duration = this.getWorkingDays(minStart, maxFinish, calendar);
        }
        parent.progress = totalDuration > 0 ? Math.round(totalWeightedProgress / totalDuration) : 0;
      });
    }
    /**
     * Parse predecessor string into structured objects
     */
    static parsePredecessors(predStr, tasks) {
      if (!predStr || typeof predStr !== "string") return [];
      const wbsMap = /* @__PURE__ */ new Map();
      tasks.forEach((t, idx) => {
        wbsMap.set(t.wbs, t);
        wbsMap.set((idx + 1).toString(), t);
        wbsMap.set(t.id, t);
      });
      const items = predStr.split(",").map((s) => s.trim()).filter(Boolean);
      const results = [];
      items.forEach((item) => {
        const match = item.match(/^([\w.]+)(FS|SS|FF|SF)?(?:([+-])(\d+)[dD]?)?$/i);
        if (match) {
          const targetRef = match[1];
          const type = (match[2] || "FS").toUpperCase();
          const sign = match[3] === "-" ? -1 : 1;
          const lag = match[4] ? parseInt(match[4], 10) * sign : 0;
          const targetTask = wbsMap.get(targetRef);
          if (targetTask) {
            results.push({
              targetTask,
              type,
              lag
            });
          }
        }
      });
      return results;
    }
    /**
     * Run Auto-Scheduler & Critical Path Method (CPM) using Calendar Engine
     */
    static scheduleProject(tasks, calendar) {
      if (!tasks || tasks.length === 0) return;
      this.updateWBSHierarchy(tasks, calendar);
      const leafTasks = tasks.filter((t) => !t.isSummary);
      let changed = true;
      let iterations = 0;
      const maxIterations = tasks.length * 2;
      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        leafTasks.forEach((task) => {
          const preds = this.parsePredecessors(task.predecessors, tasks);
          let earliestStart = new Date(task.start);
          preds.forEach((pred) => {
            const predTask = pred.targetTask;
            if (!predTask) return;
            let requiredDate;
            const predStart = new Date(predTask.start);
            const predFinish = new Date(predTask.finish);
            switch (pred.type) {
              case "FS":
                requiredDate = new Date(predFinish);
                requiredDate.setDate(requiredDate.getDate() + 1);
                break;
              case "SS":
                requiredDate = new Date(predStart);
                break;
              case "FF":
                requiredDate = new Date(predFinish);
                requiredDate.setDate(requiredDate.getDate() - (task.duration - 1));
                break;
              case "SF":
                requiredDate = new Date(predStart);
                requiredDate.setDate(requiredDate.getDate() - (task.duration - 1));
                break;
              default:
                requiredDate = new Date(predFinish);
                requiredDate.setDate(requiredDate.getDate() + 1);
            }
            if (pred.lag !== 0) {
              requiredDate.setDate(requiredDate.getDate() + pred.lag);
            }
            if (requiredDate > earliestStart) {
              earliestStart = requiredDate;
            }
          });
          const calculatedStart = earliestStart.toISOString().split("T")[0];
          const calculatedFinish = this.addWorkingDays(calculatedStart, task.duration, calendar);
          if (task.start !== calculatedStart || task.finish !== calculatedFinish) {
            task.start = calculatedStart;
            task.finish = calculatedFinish;
            changed = true;
          }
        });
      }
      this.updateWBSHierarchy(tasks, calendar);
      this.calculateCriticalPath(tasks);
    }
    /**
     * Calculate Critical Path (CPM) Total Slack
     */
    static calculateCriticalPath(tasks) {
      if (tasks.length === 0) return;
      let maxProjectFinish = null;
      tasks.forEach((t) => {
        if (t.finish && (!maxProjectFinish || new Date(t.finish) > new Date(maxProjectFinish))) {
          maxProjectFinish = t.finish;
        }
      });
      if (!maxProjectFinish) return;
      tasks.forEach((t) => {
        const finishDate = new Date(t.finish);
        const projFinish = new Date(maxProjectFinish);
        const diffDays = Math.abs((projFinish - finishDate) / (1e3 * 60 * 60 * 24));
        const isTargetOfPred = tasks.some((other) => {
          const otherPreds = this.parsePredecessors(other.predecessors, tasks);
          return otherPreds.some((p) => p.targetTask.id === t.id);
        });
        if (!isTargetOfPred && diffDays <= 1) {
          t.isCritical = true;
          t.slack = 0;
        } else if (t.baseline && t.baseline.finish) {
          const baselineFinish = new Date(t.baseline.finish);
          const currentFinish = new Date(t.finish);
          const drift = Math.round((currentFinish - baselineFinish) / (1e3 * 60 * 60 * 24));
          t.isCritical = drift > 0;
          t.slack = Math.max(0, -drift);
        } else {
          t.isCritical = false;
          t.slack = 0;
        }
      });
    }
  };

  // js/engine/baselineEngine.js
  var BaselineEngine = class {
    /**
     * Capture current project state as the Baseline
     */
    static captureBaseline(tasks) {
      let count = 0;
      tasks.forEach((t) => {
        t.baseline = {
          start: t.start,
          finish: t.finish,
          duration: t.duration
        };
        count++;
      });
      return count;
    }
    /**
     * Clear baseline snapshot
     */
    static clearBaseline(tasks) {
      tasks.forEach((t) => {
        t.baseline = null;
      });
    }
    /**
     * Calculate variance for a single task compared to its baseline
     */
    static getVariance(task) {
      if (!task || !task.baseline || !task.baseline.start || !task.baseline.finish) {
        return {
          hasBaseline: false,
          startVarianceDays: 0,
          finishVarianceDays: 0,
          statusText: "No Baseline",
          badgeClass: "bg-slate-100 text-slate-500",
          badgeColor: "#64748b"
        };
      }
      const baselineStart = new Date(task.baseline.start);
      const baselineFinish = new Date(task.baseline.finish);
      const currentStart = new Date(task.start);
      const currentFinish = new Date(task.finish);
      const startVarianceDays = Math.round((currentStart - baselineStart) / (1e3 * 60 * 60 * 24));
      const finishVarianceDays = Math.round((currentFinish - baselineFinish) / (1e3 * 60 * 60 * 24));
      let statusText = "On Track";
      let badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-300";
      let badgeColor = "#10b981";
      if (finishVarianceDays > 0) {
        statusText = `+${finishVarianceDays}d Delay`;
        if (finishVarianceDays <= 3) {
          badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
          badgeColor = "#f59e0b";
        } else {
          badgeClass = "bg-red-100 text-red-700 border-red-300";
          badgeColor = "#ef4444";
        }
      } else if (finishVarianceDays < 0) {
        statusText = `${finishVarianceDays}d Ahead`;
        badgeClass = "bg-blue-100 text-blue-700 border-blue-300";
        badgeColor = "#3b82f6";
      }
      return {
        hasBaseline: true,
        startVarianceDays,
        finishVarianceDays,
        statusText,
        badgeClass,
        badgeColor
      };
    }
    /**
     * Get summary metrics of overall project baseline variance
     */
    static getProjectBaselineMetrics(tasks) {
      const tasksWithBaseline = tasks.filter((t) => t.baseline);
      if (tasksWithBaseline.length === 0) {
        return {
          hasBaseline: false,
          delayedTasksCount: 0,
          aheadTasksCount: 0,
          onTrackCount: 0,
          maxDelayDays: 0
        };
      }
      let delayedTasksCount = 0;
      let aheadTasksCount = 0;
      let onTrackCount = 0;
      let maxDelayDays = 0;
      tasksWithBaseline.forEach((t) => {
        const v = this.getVariance(t);
        if (v.finishVarianceDays > 0) {
          delayedTasksCount++;
          if (v.finishVarianceDays > maxDelayDays) maxDelayDays = v.finishVarianceDays;
        } else if (v.finishVarianceDays < 0) {
          aheadTasksCount++;
        } else {
          onTrackCount++;
        }
      });
      return {
        hasBaseline: true,
        delayedTasksCount,
        aheadTasksCount,
        onTrackCount,
        maxDelayDays,
        totalTasks: tasksWithBaseline.length
      };
    }
  };

  // js/views/wbsGridView.js
  var WbsGridView = class {
    constructor(containerElement, onTaskChange, onTaskSelect) {
      this.container = containerElement;
      this.onTaskChange = onTaskChange;
      this.onTaskSelect = onTaskSelect;
      this.selectedTaskId = null;
      this.resources = [];
      this.visibleColumns = {
        workstream: true,
        stage: true,
        status: true,
        assignedTo: true,
        duration: true,
        dates: true,
        predecessors: true,
        leadTime: true,
        variance: true
      };
    }
    render(tasks, resources = []) {
      if (!this.container) return;
      this.tasks = tasks;
      this.resources = resources;
      const html = `
            <div class="wbs-grid-container flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden select-none">
                <!-- Grid Header Toolbar -->
                <div class="wbs-toolbar flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200 text-xs gap-1 flex-wrap">
                    <div class="flex items-center gap-1">
                        <button id="btn-add-task" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1 shadow-sm transition">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                            Add Activity
                        </button>
                        <div class="h-4 w-px bg-slate-300 mx-1"></div>
                        <button id="btn-indent" title="Indent (Make Child)" class="p-1 hover:bg-slate-200 text-slate-600 rounded transition disabled:opacity-40" ${!this.selectedTaskId ? "disabled" : ""}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                        </button>
                        <button id="btn-outdent" title="Outdent (Promote Parent)" class="p-1 hover:bg-slate-200 text-slate-600 rounded transition disabled:opacity-40" ${!this.selectedTaskId ? "disabled" : ""}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                        </button>
                        <button id="btn-delete" title="Delete Selected" class="p-1 hover:bg-red-100 text-red-600 rounded transition disabled:opacity-40" ${!this.selectedTaskId ? "disabled" : ""}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>

                    <!-- Filter / Search -->
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <input type="text" id="wbs-search" placeholder="Search tasks..." class="w-32 focus:w-44 transition-all text-xs pl-7 pr-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            <svg class="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Table Content Container -->
                <div class="wbs-table-wrapper flex-1 overflow-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-300 text-slate-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th class="py-2 px-2 w-12 text-center border-r border-slate-200">WBS</th>
                                <th class="py-2 px-3 min-w-[180px] border-r border-slate-200">Activity Name</th>
                                ${this.visibleColumns.workstream ? '<th class="py-2 px-2 w-24 border-r border-slate-200">Stream</th>' : ""}
                                ${this.visibleColumns.stage ? '<th class="py-2 px-2 w-16 border-r border-slate-200">Stage</th>' : ""}
                                ${this.visibleColumns.assignedTo ? '<th class="py-2 px-2 min-w-[140px] border-r border-slate-200">Assigned Engineers</th>' : ""}
                                ${this.visibleColumns.status ? '<th class="py-2 px-2 w-24 border-r border-slate-200">Status</th>' : ""}
                                ${this.visibleColumns.duration ? '<th class="py-2 px-2 w-16 text-center border-r border-slate-200">Dur (d)</th>' : ""}
                                ${this.visibleColumns.leadTime ? '<th class="py-2 px-2 w-16 text-center border-r border-slate-200" title="Procurement Lead Time">Lead (d)</th>' : ""}
                                ${this.visibleColumns.dates ? '<th class="py-2 px-2 w-24 border-r border-slate-200">Start</th>' : ""}
                                ${this.visibleColumns.dates ? '<th class="py-2 px-2 w-24 border-r border-slate-200">Finish</th>' : ""}
                                ${this.visibleColumns.predecessors ? '<th class="py-2 px-2 w-24 border-r border-slate-200">Predecessors</th>' : ""}
                                ${this.visibleColumns.variance ? '<th class="py-2 px-2 w-24 text-center border-r border-slate-200">Variance</th>' : ""}
                            </tr>
                        </thead>
                        <tbody id="wbs-tbody" class="divide-y divide-slate-200 font-normal text-slate-800 bg-white">
                            ${this.renderRows(tasks)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Resource Assignment Popover Container -->
            <div id="assignment-popover-container"></div>
        `;
      this.container.innerHTML = html;
      this.attachEventListeners();
    }
    renderRows(tasks) {
      if (!tasks || tasks.length === 0) {
        return `<tr><td colspan="12" class="p-6 text-center text-slate-400 italic">No tasks found. Click "Add Activity" to create one.</td></tr>`;
      }
      const hiddenIds = /* @__PURE__ */ new Set();
      const idMap = new Map(tasks.map((t) => [t.id, t]));
      tasks.forEach((t) => {
        if (t.parentId) {
          let parent = idMap.get(t.parentId);
          while (parent) {
            if (parent.expanded === false) {
              hiddenIds.add(t.id);
              break;
            }
            parent = parent.parentId ? idMap.get(parent.parentId) : null;
          }
        }
      });
      return tasks.map((t) => {
        if (hiddenIds.has(t.id)) return "";
        const isSelected = t.id === this.selectedTaskId;
        const variance = BaselineEngine.getVariance(t);
        const indentLevel = (t.wbs.split(".").length - 1) * 14;
        const wsInfo = WORKSTREAMS[t.workstream] || { name: t.workstream, color: "#6366f1", bg: "#e0e7ff" };
        const statusInfo = STATUS_PILLS[t.status] || { label: t.status, class: "bg-indigo-100 text-indigo-800 border-indigo-300" };
        const assignments = t.getAssignedResources();
        return `
                <tr data-id="${t.id}" class="wbs-row hover:bg-slate-50 transition-colors ${isSelected ? "bg-indigo-50 border-l-4 border-indigo-600 font-medium" : ""} ${t.isSummary ? "font-semibold bg-slate-50/70" : ""}">
                    <!-- WBS -->
                    <td class="py-1.5 px-2 text-center text-slate-500 text-[11px] font-mono border-r border-slate-200">
                        ${t.wbs}
                    </td>

                    <!-- Activity Name -->
                    <td class="py-1 px-2 border-r border-slate-200 overflow-hidden">
                        <div class="flex items-center gap-1" style="padding-left: ${indentLevel}px;">
                            ${t.isSummary ? `
                                <button data-action="toggle-expand" data-id="${t.id}" class="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition">
                                    <svg class="w-3.5 h-3.5 transform ${t.expanded ? "rotate-90" : ""} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                </button>
                            ` : `
                                <span class="w-4 inline-block"></span>
                            `}
                            ${t.isMilestone ? `
                                <svg class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>
                            ` : ""}
                            <input type="text" data-field="name" data-id="${t.id}" value="${this.escapeHtml(t.name)}" class="w-full bg-transparent hover:bg-white focus:bg-white border-b border-transparent focus:border-indigo-500 px-1 py-0.5 rounded focus:outline-none text-xs truncate">
                        </div>
                    </td>

                    <!-- Workstream -->
                    ${this.visibleColumns.workstream ? `
                        <td class="py-1 px-1 border-r border-slate-200">
                            <select data-field="workstream" data-id="${t.id}" class="w-full text-[11px] font-medium rounded px-1.5 py-0.5 border border-slate-200 focus:outline-none" style="background-color: ${wsInfo.bg}; color: ${wsInfo.color};">
                                ${Object.keys(WORKSTREAMS).map((ws) => `
                                    <option value="${ws}" ${t.workstream === ws ? "selected" : ""}>${ws}</option>
                                `).join("")}
                                <option value="__ADD_CUSTOM_STREAM__">+ Add Custom...</option>
                            </select>
                        </td>
                    ` : ""}

                    <!-- Stage -->
                    ${this.visibleColumns.stage ? `
                        <td class="py-1 px-1 border-r border-slate-200 text-center">
                            <select data-field="stage" data-id="${t.id}" class="text-[11px] font-medium bg-slate-100 border border-slate-200 rounded px-1 py-0.5 focus:outline-none">
                                ${HARDWARE_STAGES.map((stg) => `
                                    <option value="${stg}" ${t.stage === stg ? "selected" : ""}>${stg}</option>
                                `).join("")}
                                <option value="__ADD_CUSTOM_STAGE__">+ Add Custom...</option>
                            </select>
                        </td>
                    ` : ""}

                    <!-- Multi-Engineer Assigned Badge Cell -->
                    ${this.visibleColumns.assignedTo ? `
                        <td class="py-1 px-1 border-r border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition-colors" data-action="open-assignment-modal" data-id="${t.id}">
                            <div class="flex items-center gap-1 flex-wrap">
                                ${assignments.length === 0 ? `
                                    <span class="text-slate-400 italic text-[10px] px-1">+ Assign Engineers</span>
                                ` : assignments.map((a) => `
                                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium">
                                        <span>${this.escapeHtml(a.name)}</span>
                                        <span class="font-mono text-[9px] font-bold text-indigo-700">(${a.units || 100}%)</span>
                                    </span>
                                `).join("")}
                            </div>
                        </td>
                    ` : ""}

                    <!-- Status -->
                    ${this.visibleColumns.status ? `
                        <td class="py-1 px-1 border-r border-slate-200">
                            <select data-field="status" data-id="${t.id}" class="w-full text-[11px] font-medium rounded px-1.5 py-0.5 border ${statusInfo.class} focus:outline-none">
                                ${Object.keys(STATUS_PILLS).map((st) => `
                                    <option value="${st}" ${t.status === st ? "selected" : ""}>${STATUS_PILLS[st].label}</option>
                                `).join("")}
                                <option value="__ADD_CUSTOM_STATUS__">+ Add Custom...</option>
                            </select>
                        </td>
                    ` : ""}

                    <!-- Duration -->
                    ${this.visibleColumns.duration ? `
                        <td class="py-1 px-1 text-center border-r border-slate-200">
                            <input type="number" min="0" max="365" data-field="duration" data-id="${t.id}" value="${t.duration}" ${t.isSummary ? 'disabled class="w-12 text-center bg-slate-100 text-slate-500 font-semibold rounded py-0.5 text-xs"' : 'class="w-12 text-center border border-slate-200 focus:border-indigo-500 rounded py-0.5 text-xs focus:outline-none"'}>
                        </td>
                    ` : ""}

                    <!-- Procurement Lead Time -->
                    ${this.visibleColumns.leadTime ? `
                        <td class="py-1 px-1 text-center border-r border-slate-200">
                            <input type="number" min="0" max="180" data-field="leadTime" data-id="${t.id}" value="${t.leadTime || 0}" class="w-12 text-center border border-amber-200 bg-amber-50/50 rounded py-0.5 text-xs focus:outline-none" title="Procurement lead time in days">
                        </td>
                    ` : ""}

                    <!-- Start Date -->
                    ${this.visibleColumns.dates ? `
                        <td class="py-1 px-1 border-r border-slate-200">
                            <input type="date" data-field="start" data-id="${t.id}" value="${t.start}" ${t.isSummary ? 'disabled class="w-full bg-slate-100 text-slate-600 rounded py-0.5 text-[11px] text-center"' : 'class="w-full border border-slate-200 rounded py-0.5 text-[11px] text-center focus:outline-none"'}>
                        </td>
                    ` : ""}

                    <!-- Finish Date -->
                    ${this.visibleColumns.dates ? `
                        <td class="py-1 px-1 border-r border-slate-200">
                            <input type="date" data-field="finish" data-id="${t.id}" value="${t.finish}" disabled class="w-full bg-slate-100 text-slate-600 rounded py-0.5 text-[11px] text-center">
                        </td>
                    ` : ""}

                    <!-- Predecessors -->
                    ${this.visibleColumns.predecessors ? `
                        <td class="py-1 px-1 border-r border-slate-200">
                            <input type="text" data-field="predecessors" data-id="${t.id}" value="${this.escapeHtml(t.predecessors || "")}" placeholder="e.g. 1FS+2d" class="w-full border border-slate-200 font-mono text-[11px] rounded px-1 py-0.5 focus:outline-none">
                        </td>
                    ` : ""}

                    <!-- Variance -->
                    ${this.visibleColumns.variance ? `
                        <td class="py-1 px-1 text-center border-r border-slate-200">
                            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${variance.badgeClass}">
                                ${variance.statusText}
                            </span>
                        </td>
                    ` : ""}
                </tr>
            `;
      }).join("");
    }
    attachEventListeners() {
      if (!this.container) return;
      this.container.querySelectorAll(".wbs-row").forEach((row) => {
        row.addEventListener("click", (e) => {
          if (["INPUT", "SELECT", "BUTTON", "SVG", "PATH"].includes(e.target.tagName)) return;
          const id = row.getAttribute("data-id");
          this.selectTask(id);
        });
      });
      this.container.querySelectorAll('[data-action="toggle-expand"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id");
          const task = this.tasks.find((t) => t.id === id);
          if (task) {
            task.expanded = !task.expanded;
            this.render(this.tasks, this.resources);
          }
        });
      });
      this.container.querySelectorAll('[data-action="open-assignment-modal"]').forEach((cell) => {
        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = cell.getAttribute("data-id");
          this.openAssignmentModal(id);
        });
      });
      this.container.querySelectorAll("input[data-field], select[data-field]").forEach((element) => {
        element.addEventListener("change", (e) => {
          const id = element.getAttribute("data-id");
          const field = element.getAttribute("data-field");
          let value = element.value;
          if (value === "__ADD_CUSTOM_STREAM__") {
            const customName = prompt("Enter custom stream name (e.g., REL for Reliability):");
            if (customName && customName.trim()) {
              value = registerCustomWorkstream(customName.substr(0, 4), customName.trim());
            } else {
              this.render(this.tasks, this.resources);
              return;
            }
          } else if (value === "__ADD_CUSTOM_STAGE__") {
            const customStage = prompt("Enter custom project stage name (e.g., Certification):");
            if (customStage && customStage.trim()) {
              value = registerCustomStage(customStage.trim());
            } else {
              this.render(this.tasks, this.resources);
              return;
            }
          } else if (value === "__ADD_CUSTOM_STATUS__") {
            const customStatus = prompt("Enter custom status label (e.g., In Review):");
            if (customStatus && customStatus.trim()) {
              value = registerCustomStatus(customStatus.trim());
            } else {
              this.render(this.tasks, this.resources);
              return;
            }
          }
          if (field === "duration" || field === "leadTime") {
            value = parseInt(value, 10) || 0;
          }
          if (this.onTaskChange) {
            this.onTaskChange(id, field, value);
          }
        });
      });
      const addBtn = this.container.querySelector("#btn-add-task");
      if (addBtn) addBtn.onclick = () => this.onTaskChange(null, "add-task");
      const indentBtn = this.container.querySelector("#btn-indent");
      if (indentBtn) indentBtn.onclick = () => this.onTaskChange(this.selectedTaskId, "indent");
      const outdentBtn = this.container.querySelector("#btn-outdent");
      if (outdentBtn) outdentBtn.onclick = () => this.onTaskChange(this.selectedTaskId, "outdent");
      const deleteBtn = this.container.querySelector("#btn-delete");
      if (deleteBtn) deleteBtn.onclick = () => this.onTaskChange(this.selectedTaskId, "delete");
      const searchInput = this.container.querySelector("#wbs-search");
      if (searchInput) {
        searchInput.oninput = (e) => {
          const query = e.target.value.toLowerCase().trim();
          this.filterTasks(query);
        };
      }
    }
    openAssignmentModal(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const popoverContainer = this.container.querySelector("#assignment-popover-container");
      if (!popoverContainer) return;
      const currentAssignments = task.getAssignedResources();
      const currentMap = new Map(currentAssignments.map((a) => [a.name, a.units || 100]));
      const html = `
            <div id="assignment-modal-backdrop" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                    <div class="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                        <div class="font-bold text-xs flex items-center gap-1.5">
                            <span>\u{1F465} Resource Assignment & Fractional Units</span>
                        </div>
                        <button id="assign-modal-close" class="text-slate-400 hover:text-white font-bold">\u2715</button>
                    </div>

                    <div class="p-4 space-y-3 text-xs">
                        <p class="text-slate-500 text-[11px]">Select engineers and assign fractional day units for task <strong class="text-slate-800 font-semibold">"${this.escapeHtml(task.name)}"</strong>:</p>

                        <div class="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                            ${this.resources.length === 0 ? `
                                <div class="text-slate-400 italic text-center p-2">No engineers in team pool. Add engineers in Engineer Workload tab.</div>
                            ` : this.resources.map((res) => {
        const isAssigned = currentMap.has(res.name);
        const currentUnits = currentMap.get(res.name) || 100;
        return `
                                    <div class="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
                                        <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                                            <input type="checkbox" data-res-name="${this.escapeHtml(res.name)}" ${isAssigned ? "checked" : ""} class="assign-checkbox rounded text-indigo-600 focus:ring-indigo-500">
                                            <span>${this.escapeHtml(res.name)} <span class="text-slate-400 text-[10px]">(${res.role})</span></span>
                                        </label>
                                        <div class="flex items-center gap-1">
                                            <span class="text-[10px] text-slate-400">Load:</span>
                                            <select data-res-units="${this.escapeHtml(res.name)}" class="assign-units-select text-[11px] font-bold border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none">
                                                <option value="100" ${currentUnits === 100 ? "selected" : ""}>100% (8h/d)</option>
                                                <option value="75" ${currentUnits === 75 ? "selected" : ""}>75% (6h/d)</option>
                                                <option value="50" ${currentUnits === 50 ? "selected" : ""}>50% (4h/d)</option>
                                                <option value="25" ${currentUnits === 25 ? "selected" : ""}>25% (2h/d)</option>
                                            </select>
                                        </div>
                                    </div>
                                `;
      }).join("")}
                        </div>
                    </div>

                    <div class="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
                        <button id="assign-modal-cancel" class="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded font-medium text-xs">Cancel</button>
                        <button id="assign-modal-save" class="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow">Save Assignments</button>
                    </div>
                </div>
            </div>
        `;
      popoverContainer.innerHTML = html;
      const closeModal = () => {
        popoverContainer.innerHTML = "";
      };
      popoverContainer.querySelector("#assign-modal-close").onclick = closeModal;
      popoverContainer.querySelector("#assign-modal-cancel").onclick = closeModal;
      popoverContainer.querySelector("#assign-modal-save").onclick = () => {
        const newAssignments = [];
        popoverContainer.querySelectorAll(".assign-checkbox").forEach((cb) => {
          if (cb.checked) {
            const name = cb.getAttribute("data-res-name");
            const unitsSelect = popoverContainer.querySelector(`[data-res-units="${CSS.escape(name)}"]`);
            const units = unitsSelect ? parseInt(unitsSelect.value, 10) : 100;
            newAssignments.push({ name, units });
          }
        });
        task.assignedResources = newAssignments;
        task.assignedTo = newAssignments.length > 0 ? newAssignments[0].name : "";
        if (this.onTaskChange) {
          this.onTaskChange(task.id, "assignedResources", newAssignments);
        }
        closeModal();
      };
    }
    selectTask(taskId) {
      this.selectedTaskId = taskId;
      this.container.querySelectorAll(".wbs-row").forEach((r) => {
        if (r.getAttribute("data-id") === taskId) {
          r.classList.add("bg-indigo-50", "border-l-4", "border-indigo-600", "font-medium");
        } else {
          r.classList.remove("bg-indigo-50", "border-l-4", "border-indigo-600", "font-medium");
        }
      });
      ["#btn-indent", "#btn-outdent", "#btn-delete"].forEach((selector) => {
        const btn = this.container.querySelector(selector);
        if (btn) btn.disabled = !taskId;
      });
      if (this.onTaskSelect) {
        this.onTaskSelect(taskId);
      }
    }
    filterTasks(query) {
      const tbody = this.container.querySelector("#wbs-tbody");
      if (!tbody) return;
      if (!query) {
        tbody.innerHTML = this.renderRows(this.tasks);
        this.attachEventListeners();
        return;
      }
      const filtered = this.tasks.filter(
        (t) => t.name.toLowerCase().includes(query) || t.wbs.includes(query) || t.getFormattedAssignments().toLowerCase().includes(query) || t.workstream.toLowerCase().includes(query) || t.stage.toLowerCase().includes(query)
      );
      tbody.innerHTML = this.renderRows(filtered);
      this.attachEventListeners();
    }
    escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/ganttView.js
  var GanttView = class {
    constructor(containerElement, onTaskUpdate) {
      this.container = containerElement;
      this.onTaskUpdate = onTaskUpdate;
      this.zoom = "Week";
      this.showCriticalPath = false;
      this.showBaselineGhost = true;
      this.dragState = null;
      this.dayWidth = 28;
      this.rowHeight = 33;
      this.calendar = null;
    }
    render(tasks, calendar) {
      if (!this.container) return;
      this.tasks = tasks;
      this.calendar = calendar;
      const bounds = this.getTimelineBounds(tasks);
      this.startDate = bounds.start;
      this.endDate = bounds.end;
      this.totalDays = DependencyEngine.getWorkingDays(this.startDate, this.endDate, this.calendar) + 14;
      if (this.zoom === "Day") this.dayWidth = 44;
      else if (this.zoom === "Week") this.dayWidth = 28;
      else if (this.zoom === "Month") this.dayWidth = 14;
      const timelineWidth = Math.max(800, this.totalDays * this.dayWidth);
      const visibleTasks = this.getVisibleTasks(tasks);
      const html = `
            <div class="gantt-container flex flex-col h-full bg-white overflow-hidden select-none">
                <!-- Gantt Controls Toolbar -->
                <div class="gantt-toolbar flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200 text-xs gap-2">
                    <!-- Zoom Controls -->
                    <div class="flex items-center gap-1">
                        <span class="text-slate-500 font-semibold uppercase text-[10px]">Zoom:</span>
                        <div class="inline-flex rounded-md shadow-sm" role="group">
                            <button data-zoom="Day" class="px-2.5 py-1 text-xs font-medium rounded-l border border-slate-300 ${this.zoom === "Day" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 hover:bg-slate-50"} transition">Day</button>
                            <button data-zoom="Week" class="px-2.5 py-1 text-xs font-medium border-t border-b border-slate-300 ${this.zoom === "Week" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 hover:bg-slate-50"} transition">Week</button>
                            <button data-zoom="Month" class="px-2.5 py-1 text-xs font-medium rounded-r border border-slate-300 ${this.zoom === "Month" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 hover:bg-slate-50"} transition">Month</button>
                        </div>
                    </div>

                    <!-- Toggles -->
                    <div class="flex items-center gap-3">
                        <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                            <input type="checkbox" id="toggle-critical-path" ${this.showCriticalPath ? "checked" : ""} class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                            <span class="${this.showCriticalPath ? "text-red-700 font-bold" : ""}">Critical Path</span>
                        </label>
                        <label class="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                            <input type="checkbox" id="toggle-baseline-ghost" ${this.showBaselineGhost ? "checked" : ""} class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5">
                            <span>Baseline Shadows</span>
                        </label>
                    </div>
                </div>

                <!-- Timeline View Area -->
                <div class="gantt-scroll-pane flex-1 overflow-auto relative bg-white">
                    <div style="width: ${timelineWidth}px;" class="min-h-full relative">
                        <!-- Header Calendar Row -->
                        <div class="gantt-header sticky top-0 z-20 bg-slate-100 border-b border-slate-300 font-medium text-slate-600 text-xs shadow-sm">
                            ${this.renderHeader(timelineWidth)}
                        </div>

                        <!-- Main Gantt SVG Layer -->
                        <div class="gantt-body relative" style="height: ${visibleTasks.length * this.rowHeight}px;">
                            <!-- Grid Background Lines with Calendar Shading -->
                            ${this.renderGridLines(timelineWidth, visibleTasks.length)}

                            <!-- Predecessor Connector Lines SVG -->
                            <svg class="gantt-connectors-layer absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                                ${this.renderDependencies(visibleTasks)}
                            </svg>

                            <!-- Task Bars Layer -->
                            <div class="gantt-bars-layer absolute inset-0 w-full h-full z-15">
                                ${visibleTasks.map((task, idx) => this.renderTaskBar(task, idx)).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
      this.container.innerHTML = html;
      this.attachEventListeners(visibleTasks);
    }
    getTimelineBounds(tasks) {
      let minDate = /* @__PURE__ */ new Date();
      let maxDate = /* @__PURE__ */ new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (tasks && tasks.length > 0) {
        let first = true;
        tasks.forEach((t) => {
          if (t.start) {
            const s = new Date(t.start);
            if (first || s < minDate) minDate = s;
          }
          if (t.finish) {
            const f = new Date(t.finish);
            if (first || f > maxDate) maxDate = f;
          }
          if (t.baseline && t.baseline.finish) {
            const bf = new Date(t.baseline.finish);
            if (bf > maxDate) maxDate = bf;
          }
          first = false;
        });
      }
      minDate.setDate(minDate.getDate() - 5);
      maxDate.setDate(maxDate.getDate() + 14);
      return {
        start: minDate.toISOString().split("T")[0],
        end: maxDate.toISOString().split("T")[0]
      };
    }
    getVisibleTasks(tasks) {
      const hiddenIds = /* @__PURE__ */ new Set();
      const idMap = new Map(tasks.map((t) => [t.id, t]));
      tasks.forEach((t) => {
        if (t.parentId) {
          let parent = idMap.get(t.parentId);
          while (parent) {
            if (parent.expanded === false) {
              hiddenIds.add(t.id);
              break;
            }
            parent = parent.parentId ? idMap.get(parent.parentId) : null;
          }
        }
      });
      return tasks.filter((t) => !hiddenIds.has(t.id));
    }
    renderHeader(timelineWidth) {
      const monthsHtml = [];
      const daysHtml = [];
      let curr = new Date(this.startDate);
      const end = new Date(this.endDate);
      let currentMonth = "";
      let monthWidth = 0;
      while (curr <= end) {
        const dateStr = curr.toISOString().split("T")[0];
        const monthName = curr.toLocaleString("default", { month: "short", year: "numeric" });
        const dayNum = curr.getDate();
        const isHoliday = CalendarEngine.getHoliday(dateStr, this.calendar);
        const isOvertime = CalendarEngine.getOvertime(dateStr, this.calendar);
        const isWorking = CalendarEngine.isWorkingDay(dateStr, this.calendar);
        let bgClass = "bg-white text-slate-700 font-semibold";
        let titleAttr = "";
        if (isOvertime) {
          bgClass = "bg-amber-200 text-amber-900 font-bold";
          titleAttr = `Overtime: ${isOvertime.note}`;
        } else if (isHoliday) {
          bgClass = "bg-red-200 text-red-900 font-bold";
          titleAttr = `Holiday: ${isHoliday.name}`;
        } else if (!isWorking) {
          bgClass = "bg-slate-200/70 text-slate-400 font-normal";
          titleAttr = "Weekly Off";
        }
        daysHtml.push(`
                <div style="width: ${this.dayWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-200 text-[10px] ${bgClass}" title="${titleAttr}">
                    ${dayNum}
                </div>
            `);
        if (monthName !== currentMonth) {
          if (currentMonth) {
            monthsHtml.push(`<div style="width: ${monthWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-300 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wide truncate bg-slate-100">${currentMonth}</div>`);
          }
          currentMonth = monthName;
          monthWidth = this.dayWidth;
        } else {
          monthWidth += this.dayWidth;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (currentMonth) {
        monthsHtml.push(`<div style="width: ${monthWidth}px;" class="flex-shrink-0 text-center py-1 border-r border-slate-300 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wide truncate bg-slate-100">${currentMonth}</div>`);
      }
      return `
            <div class="flex">${monthsHtml.join("")}</div>
            <div class="flex">${daysHtml.join("")}</div>
        `;
    }
    renderGridLines(timelineWidth, rowCount) {
      const columns = [];
      let curr = new Date(this.startDate);
      const end = new Date(this.endDate);
      while (curr <= end) {
        const dateStr = curr.toISOString().split("T")[0];
        const isHoliday = CalendarEngine.getHoliday(dateStr, this.calendar);
        const isOvertime = CalendarEngine.getOvertime(dateStr, this.calendar);
        const isWorking = CalendarEngine.isWorkingDay(dateStr, this.calendar);
        let bgClass = "";
        if (isOvertime) {
          bgClass = "bg-amber-50/50";
        } else if (isHoliday) {
          bgClass = "bg-red-50/40";
        } else if (!isWorking) {
          bgClass = "bg-slate-100/70";
        }
        columns.push(`
                <div style="width: ${this.dayWidth}px;" class="h-full flex-shrink-0 border-r border-slate-100 ${bgClass}"></div>
            `);
        curr.setDate(curr.getDate() + 1);
      }
      return `
            <div class="absolute inset-0 flex pointer-events-none">
                ${columns.join("")}
            </div>
        `;
    }
    dateToPixel(dateStr) {
      if (!dateStr) return 0;
      const d = new Date(dateStr);
      const start = new Date(this.startDate);
      const days = (d - start) / (1e3 * 60 * 60 * 24);
      return Math.max(0, days * this.dayWidth);
    }
    pixelToDate(px) {
      const days = Math.round(px / this.dayWidth);
      const start = new Date(this.startDate);
      start.setDate(start.getDate() + days);
      return start.toISOString().split("T")[0];
    }
    renderTaskBar(task, rowIndex) {
      const y = rowIndex * this.rowHeight + 4;
      const x = this.dateToPixel(task.start);
      const finishX = this.dateToPixel(task.finish);
      const width = Math.max(this.dayWidth, finishX - x + this.dayWidth);
      const ws = WORKSTREAMS[task.workstream] || WORKSTREAMS["HW"];
      const isCritical = this.showCriticalPath && task.isCritical;
      const variance = BaselineEngine.getVariance(task);
      let baselineGhostHtml = "";
      if (this.showBaselineGhost && task.baseline && task.baseline.start && task.baseline.finish) {
        const bx = this.dateToPixel(task.baseline.start);
        const bFinishX = this.dateToPixel(task.baseline.finish);
        const bWidth = Math.max(this.dayWidth, bFinishX - bx + this.dayWidth);
        const ghostY = y + 18;
        baselineGhostHtml = `
                <div style="left: ${bx}px; top: ${ghostY}px; width: ${bWidth}px; height: 6px;" class="absolute rounded bg-slate-300/70 border border-slate-400 border-dashed pointer-events-none z-10" title="Baseline: ${task.baseline.start} to ${task.baseline.finish}"></div>
            `;
      }
      if (task.isSummary) {
        return `
                ${baselineGhostHtml}
                <div data-task-id="${task.id}" style="left: ${x}px; top: ${y + 4}px; width: ${width}px; height: 16px;" class="gantt-summary-bar absolute group cursor-pointer z-15">
                    <div class="w-full h-2.5 bg-slate-800 rounded-t flex items-center relative">
                        <div class="h-full bg-slate-600 rounded-t" style="width: ${task.progress || 0}%;"></div>
                    </div>
                    <div class="absolute -left-1 top-0 w-2 h-4 bg-slate-800 clip-path-left"></div>
                    <div class="absolute -right-1 top-0 w-2 h-4 bg-slate-800 clip-path-right"></div>
                    <span class="absolute left-full ml-2 top-0 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                        ${this.escapeHtml(task.name)} (${task.progress}%)
                    </span>
                </div>
            `;
      }
      if (task.isMilestone) {
        const mx = x + this.dayWidth / 2 - 8;
        return `
                ${baselineGhostHtml}
                <div data-task-id="${task.id}" style="left: ${mx}px; top: ${y + 2}px;" class="gantt-milestone absolute cursor-move group z-20" title="${this.escapeHtml(task.name)} (${task.start})">
                    <div class="w-4 h-4 bg-amber-500 transform rotate-45 border-2 border-amber-600 shadow-sm group-hover:scale-115 transition-transform"></div>
                    <span class="absolute left-5 top-0 text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                        \u25C6 ${this.escapeHtml(task.name)}
                    </span>
                </div>
            `;
      }
      let leadTimeHtml = "";
      if (task.leadTime > 0) {
        const lx = finishX + this.dayWidth;
        const lWidth = task.leadTime * this.dayWidth;
        leadTimeHtml = `
                <div style="left: ${lx}px; top: ${y + 6}px; width: ${lWidth}px; height: 12px;" class="absolute bg-amber-100 border border-amber-300 border-dashed rounded-r flex items-center px-1 text-[9px] font-bold text-amber-800 truncate z-10" title="Procurement Lead Time: +${task.leadTime} days">
                    +${task.leadTime}d Lead
                </div>
            `;
      }
      const barColor = isCritical ? "#ef4444" : ws.color;
      const progressWidth = `${task.progress || 0}%`;
      return `
            ${baselineGhostHtml}
            ${leadTimeHtml}
            <div data-task-id="${task.id}" style="left: ${x}px; top: ${y}px; width: ${width}px; height: 22px; background-color: ${barColor};" class="gantt-task-bar absolute rounded shadow-sm border ${isCritical ? "border-red-600 ring-2 ring-red-300" : "border-black/10"} group cursor-move z-15 flex items-center text-white text-[11px] font-medium px-2 select-none overflow-visible">
                <div style="width: ${progressWidth};" class="absolute left-0 top-0 bottom-0 bg-black/25 rounded-l pointer-events-none"></div>

                <span class="relative z-10 truncate text-[11px] font-medium">
                    ${this.escapeHtml(task.name)} ${task.getFormattedAssignments() !== "Unassigned" ? `(${this.escapeHtml(task.getFormattedAssignments())})` : ""}
                </span>

                ${variance.hasBaseline && variance.finishVarianceDays !== 0 ? `
                    <span class="absolute left-full ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${variance.badgeClass} whitespace-nowrap z-20">
                        ${variance.statusText}
                    </span>
                ` : ""}

                <div data-handle="right" data-task-id="${task.id}" class="gantt-handle-right absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/40 hover:bg-white cursor-ew-resize rounded-r transition-all"></div>
            </div>
        `;
    }
    renderDependencies(visibleTasks) {
      const taskRowIndexMap = new Map(visibleTasks.map((t, idx) => [t.id, idx]));
      const paths = [];
      visibleTasks.forEach((task) => {
        const preds = DependencyEngine.parsePredecessors(task.predecessors, visibleTasks);
        preds.forEach((pred) => {
          const targetTask = pred.targetTask;
          if (!targetTask) return;
          const fromIndex = taskRowIndexMap.get(targetTask.id);
          const toIndex = taskRowIndexMap.get(task.id);
          if (fromIndex === void 0 || toIndex === void 0) return;
          const fromY = fromIndex * this.rowHeight + 15;
          const toY = toIndex * this.rowHeight + 15;
          const fromX = this.dateToPixel(targetTask.finish) + this.dayWidth;
          const toX = this.dateToPixel(task.start);
          const isCritical = this.showCriticalPath && (task.isCritical && targetTask.isCritical);
          const strokeColor = isCritical ? "#ef4444" : "#475569";
          const strokeWidth = isCritical ? 2.5 : 1.8;
          const markerId = isCritical ? "arrowhead-red" : "arrowhead-slate";
          const midX = fromX + 12;
          let pathData = "";
          if (midX < toX) {
            pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
          } else {
            const loopY = (fromY + toY) / 2;
            pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${loopY} L ${toX - 10} ${loopY} L ${toX - 10} ${toY} L ${toX} ${toY}`;
          }
          paths.push(`
                    <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${markerId})"/>
                `);
        });
      });
      return `
            <defs>
                <marker id="arrowhead-slate" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
                </marker>
                <marker id="arrowhead-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444"/>
                </marker>
            </defs>
            ${paths.join("")}
        `;
    }
    attachEventListeners(visibleTasks) {
      if (!this.container) return;
      this.container.querySelectorAll("[data-zoom]").forEach((btn) => {
        btn.onclick = () => {
          this.zoom = btn.getAttribute("data-zoom");
          this.render(this.tasks, this.calendar);
        };
      });
      const cpToggle = this.container.querySelector("#toggle-critical-path");
      if (cpToggle) {
        cpToggle.onchange = (e) => {
          this.showCriticalPath = e.target.checked;
          this.render(this.tasks, this.calendar);
        };
      }
      const bgToggle = this.container.querySelector("#toggle-baseline-ghost");
      if (bgToggle) {
        bgToggle.onchange = (e) => {
          this.showBaselineGhost = e.target.checked;
          this.render(this.tasks, this.calendar);
        };
      }
      this.initDragAndDrop(visibleTasks);
    }
    initDragAndDrop(visibleTasks) {
      const pane = this.container.querySelector(".gantt-scroll-pane");
      if (!pane) return;
      let activeTaskId = null;
      let isResizing = false;
      let startMouseX = 0;
      let initialTaskStart = null;
      let initialDuration = 1;
      let draggedBarElement = null;
      const onMouseDown = (e) => {
        const handle = e.target.closest('[data-handle="right"]');
        const bar = e.target.closest("[data-task-id]");
        if (!bar) return;
        activeTaskId = bar.getAttribute("data-task-id");
        const task = this.tasks.find((t) => t.id === activeTaskId);
        if (!task || task.isSummary) return;
        isResizing = Boolean(handle);
        startMouseX = e.clientX;
        initialTaskStart = task.start;
        initialDuration = task.duration;
        draggedBarElement = bar;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };
      const onMouseMove = (e) => {
        if (!activeTaskId || !draggedBarElement) return;
        const deltaPx = e.clientX - startMouseX;
        const deltaDays = Math.round(deltaPx / this.dayWidth);
        const task = this.tasks.find((t) => t.id === activeTaskId);
        if (!task) return;
        if (isResizing) {
          const newDuration = Math.max(1, initialDuration + deltaDays);
          task.duration = newDuration;
          task.finish = DependencyEngine.addWorkingDays(task.start, task.duration, this.calendar);
        } else {
          const newStart = this.pixelToDate(this.dateToPixel(initialTaskStart) + deltaPx);
          task.start = newStart;
          task.finish = DependencyEngine.addWorkingDays(task.start, task.duration, this.calendar);
        }
        this.render(this.tasks, this.calendar);
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (activeTaskId && this.onTaskUpdate) {
          this.onTaskUpdate(activeTaskId);
        }
        activeTaskId = null;
        draggedBarElement = null;
      };
      pane.addEventListener("mousedown", onMouseDown);
    }
    escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/milestonesView.js
  var MilestonesView = class {
    constructor(containerElement) {
      this.container = containerElement;
    }
    render(tasks) {
      if (!this.container) return;
      const milestones = tasks.filter((t) => t.isMilestone || t.duration === 0);
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
                    ${HARDWARE_STAGES.map((stage) => this.renderStageColumn(stage, milestones)).join("")}
                </div>
            </div>
        `;
      this.container.innerHTML = html;
    }
    renderStageColumn(stage, milestones) {
      const stageMilestones = milestones.filter((m) => m.stage === stage);
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
                    ` : stageMilestones.map((m) => this.renderMilestoneCard(m)).join("")}
                </div>
            </div>
        `;
    }
    renderMilestoneCard(m) {
      const ws = WORKSTREAMS[m.workstream] || WORKSTREAMS["HW"];
      const statusInfo = STATUS_PILLS[m.status] || STATUS_PILLS["Not Started"];
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
                    ` : ""}
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
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/resourceView.js
  var ResourceView = class {
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
                                    ${this.resources.map((r) => {
        const ws = WORKSTREAMS[r.workstream] || WORKSTREAMS["HW"];
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
                                                    <button data-action="delete-resource" data-id="${r.id}" class="text-red-500 hover:text-red-700 font-bold text-xs">\u2715</button>
                                                </td>
                                            </tr>
                                        `;
      }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right: Fractional Workload Heatmap Matrix -->
                    <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-3 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wide flex justify-between items-center">
                            <span>Engineer Daily Workload Heatmap (% Fractional Loading)</span>
                            <div class="flex items-center gap-2 text-[10px]">
                                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 bg-emerald-200 rounded"></span> \u2264100% Normal</span>
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
      let curr = /* @__PURE__ */ new Date();
      curr.setDate(curr.getDate() - 2);
      for (let i = 0; i < 21; i++) {
        dates.push(curr.toISOString().split("T")[0]);
        curr.setDate(curr.getDate() + 1);
      }
      const workloadMap = /* @__PURE__ */ new Map();
      tasks.forEach((task) => {
        if (!task.start || !task.finish) return;
        const assigned = task.getAssignedResources();
        if (assigned.length === 0) return;
        assigned.forEach((a) => {
          const res = resources.find((r) => r.name === a.name || r.id === a.name);
          if (!res) return;
          const units = typeof a.units === "number" ? a.units : 100;
          let d = new Date(task.start);
          const finishDate = new Date(task.finish);
          while (d <= finishDate) {
            const dateStr = d.toISOString().split("T")[0];
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
                        ${dates.map((d) => {
        const dateObj = new Date(d);
        const dayNum = dateObj.getDate();
        const monthShort = dateObj.toLocaleString("default", { month: "short" });
        return `<th class="p-1 text-center border-r border-slate-200 min-w-[36px] text-[10px]">${monthShort}<br>${dayNum}</th>`;
      }).join("")}
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${resources.map((res) => `
                        <tr>
                            <td class="p-2 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                                ${this.escapeHtml(res.name)}
                            </td>
                            ${dates.map((d) => {
        const key = `${res.id}_${d}`;
        const load = workloadMap.get(key) || 0;
        let bgClass = "bg-white text-slate-300";
        if (load > 0 && load <= 100) {
          bgClass = "bg-emerald-100 text-emerald-800 font-bold";
        } else if (load > 100) {
          bgClass = "bg-red-500 text-white font-extrabold shadow-inner";
        }
        return `
                                    <td class="p-1 text-center border-r border-slate-200 ${bgClass} text-[10px]" title="${res.name}: ${load}% total allocation on ${d}">
                                        ${load > 0 ? `${load}%` : "-"}
                                    </td>
                                `;
      }).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }
    attachEventListeners() {
      if (!this.container) return;
      const addBtn = this.container.querySelector("#btn-add-engineer");
      if (addBtn) {
        addBtn.onclick = () => {
          const name = prompt("Enter Engineer Name:");
          if (name && name.trim()) {
            const role = prompt("Enter Engineer Role (e.g. Lead Firmware Engineer):") || "Project Engineer";
            const newRes = new Resource({
              name: name.trim(),
              role: role.trim(),
              workstream: "HW"
            });
            this.resources.push(newRes);
            if (this.onResourceChange) this.onResourceChange(this.resources);
            this.render(this.resources, this.tasks);
          }
        };
      }
      this.container.querySelectorAll('[data-action="delete-resource"]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-id");
          this.resources = this.resources.filter((r) => r.id !== id);
          if (this.onResourceChange) this.onResourceChange(this.resources);
          this.render(this.resources, this.tasks);
        };
      });
    }
    escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/calendarModalView.js
  var CalendarModalView = class {
    constructor(modalContainer, onCalendarChange) {
      this.container = modalContainer;
      this.onCalendarChange = onCalendarChange;
      this.calendar = null;
    }
    render(calendar) {
      if (!this.container) return;
      this.calendar = calendar;
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
                                \u{1F4C5} Standard Weekly Working Days
                            </h4>
                            <p class="text-slate-500 text-[11px]">Select standard working days for task scheduling (unchecked days are weekly offs):</p>
                            
                            <div class="grid grid-cols-2 md:grid-cols-7 gap-2 pt-2">
                                ${dayNames.map((name, idx) => {
        const isChecked = (this.calendar.workingDays || [1, 2, 3, 4, 5]).includes(idx);
        return `
                                        <label class="flex items-center gap-1.5 p-2 rounded border ${isChecked ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold" : "bg-white border-slate-200 text-slate-500"} cursor-pointer transition">
                                            <input type="checkbox" data-day="${idx}" ${isChecked ? "checked" : ""} class="weekly-day-checkbox rounded text-indigo-600 focus:ring-indigo-500">
                                            <span>${name.substr(0, 3)}</span>
                                        </label>
                                    `;
      }).join("")}
                            </div>
                        </div>

                        <!-- 2. Festive & Company Holidays -->
                        <div class="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                \u{1F334} Festive & Company Holidays
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
                                                    <button data-action="delete-holiday" data-index="${i}" class="text-red-600 hover:text-red-800 font-bold">\u2715</button>
                                                </td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- 3. Overtime Exception Working Days -->
                        <div class="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 class="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                \u26A1 Overtime / Weekend Working Days
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
                                                    <button data-action="delete-overtime" data-index="${i}" class="text-red-600 hover:text-red-800 font-bold">\u2715</button>
                                                </td>
                                            </tr>
                                        `).join("")}
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
      const closeBtn = this.container.querySelector("#modal-close-btn");
      const saveBtn = this.container.querySelector("#modal-save-btn");
      const backdrop = this.container.querySelector("#calendar-modal-backdrop");
      const closeModal = () => {
        this.container.innerHTML = "";
      };
      if (closeBtn) closeBtn.onclick = closeModal;
      if (backdrop) {
        backdrop.onclick = (e) => {
          if (e.target === backdrop) closeModal();
        };
      }
      if (saveBtn) {
        saveBtn.onclick = () => {
          const selectedDays = [];
          this.container.querySelectorAll(".weekly-day-checkbox").forEach((cb) => {
            if (cb.checked) {
              selectedDays.push(parseInt(cb.getAttribute("data-day"), 10));
            }
          });
          this.calendar.workingDays = selectedDays;
          if (this.onCalendarChange) {
            this.onCalendarChange(this.calendar);
          }
          closeModal();
        };
      }
      const addHolidayBtn = this.container.querySelector("#btn-add-holiday");
      if (addHolidayBtn) {
        addHolidayBtn.onclick = () => {
          const dateInput = this.container.querySelector("#new-holiday-date");
          const nameInput = this.container.querySelector("#new-holiday-name");
          if (dateInput && nameInput && dateInput.value && nameInput.value.trim()) {
            this.calendar.holidays.push({
              date: dateInput.value,
              name: nameInput.value.trim()
            });
            this.render(this.calendar);
          }
        };
      }
      this.container.querySelectorAll('[data-action="delete-holiday"]').forEach((btn) => {
        btn.onclick = () => {
          const idx = parseInt(btn.getAttribute("data-index"), 10);
          this.calendar.holidays.splice(idx, 1);
          this.render(this.calendar);
        };
      });
      const addOvertimeBtn = this.container.querySelector("#btn-add-overtime");
      if (addOvertimeBtn) {
        addOvertimeBtn.onclick = () => {
          const dateInput = this.container.querySelector("#new-overtime-date");
          const noteInput = this.container.querySelector("#new-overtime-note");
          if (dateInput && noteInput && dateInput.value && noteInput.value.trim()) {
            this.calendar.overtimeDays.push({
              date: dateInput.value,
              note: noteInput.value.trim()
            });
            this.render(this.calendar);
          }
        };
      }
      this.container.querySelectorAll('[data-action="delete-overtime"]').forEach((btn) => {
        btn.onclick = () => {
          const idx = parseInt(btn.getAttribute("data-index"), 10);
          this.calendar.overtimeDays.splice(idx, 1);
          this.render(this.calendar);
        };
      });
    }
    escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/dependencyTreeView.js
  var DependencyTreeView = class {
    constructor(containerElement) {
      this.container = containerElement;
    }
    render(tasks) {
      if (!this.container) return;
      this.tasks = tasks || [];
      const leafTasks = this.tasks.filter((t) => !t.isSummary);
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
      const stageMap = /* @__PURE__ */ new Map();
      HARDWARE_STAGES.forEach((stg) => stageMap.set(stg, []));
      leafTasks.forEach((t) => {
        const stg = t.stage || "EVT";
        if (!stageMap.has(stg)) stageMap.set(stg, []);
        stageMap.get(stg).push(t);
      });
      const columnsHtml = HARDWARE_STAGES.map((stage) => {
        const stageTasks = stageMap.get(stage) || [];
        return `
                <div class="stage-flow-column flex-shrink-0 w-72 flex flex-col gap-4">
                    <div class="p-2 bg-slate-800 text-white font-bold text-xs rounded text-center uppercase tracking-wide shadow-sm flex items-center justify-between px-3">
                        <span>${stage} Stage</span>
                        <span class="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[10px]">${stageTasks.length}</span>
                    </div>
                    <div class="space-y-4">
                        ${stageTasks.map((t) => this.renderTaskNodeCard(t)).join("")}
                    </div>
                </div>
            `;
      }).join("");
      return `
            <div class="flex gap-8 relative z-10 min-w-max pb-12">
                ${columnsHtml}
            </div>
        `;
    }
    renderTaskNodeCard(task) {
      const ws = WORKSTREAMS[task.workstream] || WORKSTREAMS["HW"];
      const statusInfo = STATUS_PILLS[task.status] || STATUS_PILLS["Not Started"];
      const isCritical = task.isCritical;
      const preds = DependencyEngine.parsePredecessors(task.predecessors, this.tasks);
      const predBadges = preds.map((p) => `${p.targetTask.wbs}${p.type}${p.lag ? p.lag > 0 ? "+" + p.lag + "d" : p.lag + "d" : ""}`).join(", ");
      return `
            <div data-node-id="${task.id}" class="task-node-card bg-white p-3 rounded-lg border-2 ${isCritical ? "border-red-500 ring-2 ring-red-200 shadow-md" : "border-slate-200 shadow-sm"} hover:shadow-lg transition-all space-y-2 relative">
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="px-1.5 py-0.5 ${isCritical ? "bg-red-600 text-white" : "bg-slate-700 text-white"} rounded font-mono text-[10px] font-bold">
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
                    <div><span class="text-slate-400">Start:</span> ${task.start || "-"}</div>
                    <div><span class="text-slate-400">End:</span> ${task.finish || "-"}</div>
                </div>

                <!-- Engineer & Predecessors -->
                <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span class="font-medium text-slate-700 truncate" title="Assigned: ${this.escapeHtml(task.getFormattedAssignments())}">
                        \u{1F464} ${this.escapeHtml(task.getFormattedAssignments())}
                    </span>
                    ${predBadges ? `
                        <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono font-bold text-[9px]" title="Predecessors: ${predBadges}">
                            \u2190 ${predBadges}
                        </span>
                    ` : ""}
                </div>

                <!-- Status Pill -->
                <div class="flex justify-between items-center pt-1">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${statusInfo.class}">
                        ${statusInfo.label}
                    </span>
                    ${isCritical ? `
                        <span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold">Critical</span>
                    ` : ""}
                </div>
            </div>
        `;
    }
    escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // js/views/infoGuideView.js
  var InfoGuideView = class {
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
                            <span>\u{1F4D6} 1. Glossary of Abbreviations & Terminology</span>
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
                            <span>\u{1F680} 2. Step-by-Step User Manual & Tool Guide</span>
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
  };

  // js/storage/projectStore.js
  var STORAGE_KEY = "hardware_pm_project_data";
  var ProjectStore = class {
    /**
     * Auto-save current tasks, resources, and calendar to LocalStorage
     */
    static saveToLocalStorage(projectTitle, tasks, resources, calendar) {
      try {
        const payload = {
          version: "1.1",
          title: projectTitle || "Hardware Project",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          tasks,
          resources,
          calendar
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
    /**
     * Load tasks, resources, and calendar from LocalStorage
     */
    static loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return {
          title: data.title || "Hardware Project",
          tasks: (data.tasks || []).map((t) => new Task(t)),
          resources: (data.resources || []).map((r) => new Resource(r)),
          calendar: new ProjectCalendar(data.calendar || {})
        };
      } catch (e) {
        console.error("Failed to load from localStorage:", e);
        return null;
      }
    }
    /**
     * Export project file as .prj (JSON format)
     */
    static exportProjectFile(projectTitle, tasks, resources, calendar) {
      const payload = {
        appName: "Antigravity Hardware PM",
        fileFormat: "hardware_pm_prj",
        version: "1.1",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        project: {
          title: projectTitle || "Hardware R&D Project",
          tasks,
          resources,
          calendar
        }
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const safeName = (projectTitle || "Hardware_Project").replace(/[^a-z0-9_-]/gi, "_");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}.prj`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    /**
     * Import project file from .prj content
     */
    static importProjectFile(jsonContent) {
      try {
        const data = JSON.parse(jsonContent);
        let rawTasks = [];
        let rawResources = [];
        let rawCalendar = {};
        if (data.project) {
          rawTasks = data.project.tasks || [];
          rawResources = data.project.resources || [];
          rawCalendar = data.project.calendar || {};
        } else {
          rawTasks = data.tasks || [];
          rawResources = data.resources || [];
          rawCalendar = data.calendar || {};
        }
        const tasks = rawTasks.map((t) => new Task(t));
        const resources = rawResources.length > 0 ? rawResources.map((r) => new Resource(r)) : DEFAULT_RESOURCES;
        const calendar = new ProjectCalendar(rawCalendar);
        DependencyEngine.scheduleProject(tasks, calendar);
        return {
          title: data.project && data.project.title || data.title || "Imported Project",
          tasks,
          resources,
          calendar
        };
      } catch (e) {
        alert("Failed to parse .prj file. Please ensure it is a valid project file.");
        return null;
      }
    }
    /**
     * Generate a new blank project structure
     */
    static getBlankProject() {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const calendar = new ProjectCalendar();
      const resources = DEFAULT_RESOURCES;
      const starterTask = new Task({
        name: "Initial Architecture Task",
        stage: "Concept",
        workstream: "HW",
        assignedTo: "Priya Sharma",
        duration: 5,
        start: today,
        status: "In Design"
      });
      const tasks = [starterTask];
      DependencyEngine.scheduleProject(tasks, calendar);
      BaselineEngine.captureBaseline(tasks);
      return {
        title: "New Hardware R&D Project",
        tasks,
        resources,
        calendar
      };
    }
    /**
     * Generate Pre-Loaded Hardware Project Template Presets
     */
    static getSamplePreset(presetId = "iot_device") {
      if (presetId === "new_blank") {
        return this.getBlankProject();
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const calendar = new ProjectCalendar();
      const resources = DEFAULT_RESOURCES;
      let tasks = [];
      if (presetId === "iot_device") {
        tasks = [
          // Concept Phase
          new Task({ name: "System Architecture & Specs", stage: "Concept", workstream: "HW", assignedTo: "Priya Sharma", duration: 5, start: DependencyEngine.addWorkingDays(today, 0, calendar), status: "Complete", progress: 100 }),
          new Task({ name: "Component Selection & BOM Costing", stage: "Concept", workstream: "PROC", assignedTo: "David Kim", duration: 4, predecessors: "1FS", status: "Complete", progress: 100 }),
          // EVT Phase
          new Task({ name: "EVT Phase - Prototype Spin", stage: "EVT", workstream: "HW", duration: 25, isSummary: true, expanded: true }),
          new Task({ name: "Schematic Capture (MCU + Sensors)", stage: "EVT", workstream: "EE", assignedTo: "Alex Rivera", duration: 6, predecessors: "2FS", status: "In Design", progress: 80 }),
          new Task({ name: "PCB Layout & Stackup Design", stage: "EVT", workstream: "EE", assignedTo: "Alex Rivera", duration: 7, predecessors: "4FS", status: "In Design", progress: 40 }),
          new Task({ name: "PCB Fab & Assembly (Vendor Lead Time)", stage: "EVT", workstream: "PROC", assignedTo: "David Kim", duration: 10, leadTime: 7, vendor: "JLCPCB Vendor", predecessors: "5FS", status: "In Fab" }),
          new Task({ name: "3D Enclosure CAD Design", stage: "EVT", workstream: "ME", assignedTo: "Marcus Vance", duration: 8, predecessors: "4SS+2d", status: "In Design", progress: 60 }),
          new Task({ name: "SLA 3D Prototype Printing", stage: "EVT", workstream: "ME", assignedTo: "Marcus Vance", duration: 3, predecessors: "7FS", status: "Not Started" }),
          new Task({ name: "Firmware Board Support Package (BSP)", stage: "EVT", workstream: "FW", assignedTo: "Sarah Chen", duration: 10, predecessors: "4SS+3d", status: "In Design", progress: 50 }),
          new Task({ name: "EVT 1st Article Assembly & Bring-Up", stage: "EVT", workstream: "HW", assignedResources: [{ name: "Priya Sharma", units: 100 }, { name: "Alex Rivera", units: 50 }], duration: 4, predecessors: "6FS, 8FS, 9FS", status: "Not Started" }),
          new Task({ name: "EVT Milestone Gate Passed", stage: "EVT", workstream: "HW", assignedTo: "Priya Sharma", duration: 0, isMilestone: true, predecessors: "10FS", status: "Not Started" }),
          // DVT Phase
          new Task({ name: "DVT Phase - Compliance & Tooling", stage: "DVT", workstream: "HW", duration: 30, isSummary: true, expanded: true }),
          new Task({ name: "Injection Mold Tooling Fabrication", stage: "DVT", workstream: "ME", assignedTo: "Marcus Vance", duration: 20, leadTime: 14, vendor: "Precision Molds Inc", predecessors: "11FS", status: "Not Started" }),
          new Task({ name: "Board Spin Rev B (RF Optimization)", stage: "DVT", workstream: "EE", assignedTo: "Alex Rivera", duration: 8, predecessors: "11FS", status: "Not Started" }),
          new Task({ name: "FCC / CE Pre-Compliance Testing", stage: "DVT", workstream: "TEST", assignedTo: "Elena Rostova", duration: 7, predecessors: "13FS, 14FS", status: "Not Started" }),
          new Task({ name: "Firmware Feature Release v1.0", stage: "DVT", workstream: "FW", assignedTo: "Sarah Chen", duration: 15, predecessors: "9FS", status: "Not Started" }),
          new Task({ name: "DVT Golden Sample Sign-Off", stage: "DVT", workstream: "HW", assignedTo: "Priya Sharma", duration: 0, isMilestone: true, predecessors: "15FS, 16FS", status: "Not Started" })
        ];
      }
      const evtSummary = tasks[2];
      tasks[3].parentId = evtSummary.id;
      tasks[4].parentId = evtSummary.id;
      tasks[5].parentId = evtSummary.id;
      tasks[6].parentId = evtSummary.id;
      tasks[7].parentId = evtSummary.id;
      tasks[8].parentId = evtSummary.id;
      tasks[9].parentId = evtSummary.id;
      tasks[10].parentId = evtSummary.id;
      const dvtSummary = tasks[11];
      tasks[12].parentId = dvtSummary.id;
      tasks[13].parentId = dvtSummary.id;
      tasks[14].parentId = dvtSummary.id;
      tasks[15].parentId = dvtSummary.id;
      tasks[16].parentId = dvtSummary.id;
      DependencyEngine.scheduleProject(tasks, calendar);
      BaselineEngine.captureBaseline(tasks);
      return {
        title: "IoT Tracker Hardware-Firmware Project",
        tasks,
        resources,
        calendar
      };
    }
  };

  // js/export/excelExporter.js
  var ExcelExporter = class {
    static exportToExcel(projectTitle, tasks, resources = [], calendar = {}) {
      if (!window.XLSX) {
        alert("SheetJS Excel library not loaded. Falling back to CSV export.");
        this.exportToCSV(projectTitle, tasks);
        return;
      }
      const wb = window.XLSX.utils.book_new();
      const wbsData = tasks.map((t) => ({
        "WBS": t.wbs,
        "Activity Name": t.name,
        "Workstream": t.workstream,
        "Hardware Stage": t.stage,
        "Assigned Engineers": t.getFormattedAssignments(),
        "Status": t.status,
        "Duration (Days)": t.duration,
        "Start Date": t.start,
        "Finish Date": t.finish,
        "Predecessors": t.predecessors || "",
        "Procurement Lead (Days)": t.leadTime || 0,
        "Vendor": t.vendor || "",
        "Progress (%)": t.progress || 0,
        "Is Milestone": t.isMilestone ? "YES" : "NO"
      }));
      const wsWbs = window.XLSX.utils.json_to_sheet(wbsData);
      window.XLSX.utils.book_append_sheet(wb, wsWbs, "WBS Tasks");
      const milestones = tasks.filter((t) => t.isMilestone || t.duration === 0);
      const milestoneData = milestones.map((m) => {
        const v = BaselineEngine.getVariance(m);
        return {
          "WBS": m.wbs,
          "Milestone Name": m.name,
          "Hardware Stage": m.stage,
          "Workstream": m.workstream,
          "Assigned Engineer": m.assignedTo || "Unassigned",
          "Target Date": m.finish || m.start,
          "Baseline Date": m.baseline && m.baseline.finish || "N/A",
          "Variance": v.statusText,
          "Status": m.status
        };
      });
      const wsMilestones = window.XLSX.utils.json_to_sheet(milestoneData);
      window.XLSX.utils.book_append_sheet(wb, wsMilestones, "Milestones");
      const resData = resources.map((r) => ({
        "Resource ID": r.id,
        "Engineer Name": r.name,
        "Role": r.role,
        "Primary Workstream": r.workstream,
        "Capacity (%)": r.capacity
      }));
      const wsRes = window.XLSX.utils.json_to_sheet(resData);
      window.XLSX.utils.book_append_sheet(wb, wsRes, "Team Resources");
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const workingDayNames = (calendar.workingDays || [1, 2, 3, 4, 5]).map((d) => dayNames[d]).join(", ");
      const calendarData = [
        { "Config Type": "Standard Weekly Working Days", "Details": workingDayNames },
        ...(calendar.holidays || []).map((h) => ({ "Config Type": "Festive / Company Holiday", "Details": `${h.date}: ${h.name}` })),
        ...(calendar.overtimeDays || []).map((o) => ({ "Config Type": "Overtime Working Day", "Details": `${o.date}: ${o.note}` }))
      ];
      const wsCal = window.XLSX.utils.json_to_sheet(calendarData);
      window.XLSX.utils.book_append_sheet(wb, wsCal, "Project Calendar");
      const fileName = `${(projectTitle || "Hardware_Project").replace(/[^a-z0-9_-]/gi, "_")}.xlsx`;
      window.XLSX.writeFile(wb, fileName);
    }
    static exportToCSV(projectTitle, tasks) {
      const headers = ["WBS", "Activity Name", "Workstream", "Stage", "Assigned Engineer", "Status", "Duration", "Start", "Finish", "Predecessors", "LeadTime", "Progress"];
      const rows = tasks.map((t) => [
        `"${t.wbs}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.workstream}"`,
        `"${t.stage}"`,
        `"${t.assignedTo || ""}"`,
        `"${t.status}"`,
        t.duration,
        `"${t.start}"`,
        `"${t.finish}"`,
        `"${(t.predecessors || "").replace(/"/g, '""')}"`,
        t.leadTime || 0,
        t.progress || 0
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(projectTitle || "Hardware_Project").replace(/[^a-z0-9_-]/gi, "_")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // js/export/printEngine.js
  var PrintEngine = class {
    static printView(target = "all") {
      const body = document.body;
      body.classList.remove("print-gantt-only", "print-wbs-only", "print-milestones-only");
      if (target === "gantt") {
        body.classList.add("print-gantt-only");
      } else if (target === "wbs") {
        body.classList.add("print-wbs-only");
      } else if (target === "milestones") {
        body.classList.add("print-milestones-only");
      }
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          body.classList.remove("print-gantt-only", "print-wbs-only", "print-milestones-only");
        }, 500);
      }, 100);
    }
  };

  // js/app.js
  var ProjectManagementApp = class {
    constructor() {
      this.projectTitle = "Project Management Schedule";
      this.tasks = [];
      this.resources = DEFAULT_RESOURCES;
      this.calendar = new ProjectCalendar();
      this.activeView = "split";
      this.selectedTaskId = null;
      this.wbsView = null;
      this.ganttView = null;
      this.milestonesView = null;
      this.resourceView = null;
      this.calendarModalView = null;
      this.deptreeView = null;
      this.infoGuideView = null;
    }
    init() {
      console.log("Initializing Project Management Application...");
      const saved = ProjectStore.loadFromLocalStorage();
      if (saved && saved.tasks && saved.tasks.length > 0) {
        this.projectTitle = saved.title;
        this.tasks = saved.tasks;
        if (saved.resources && saved.resources.length > 0) this.resources = saved.resources;
        if (saved.calendar) this.calendar = saved.calendar;
      } else {
        const preset = ProjectStore.getSamplePreset("iot_device");
        this.projectTitle = preset.title;
        this.tasks = preset.tasks;
        this.resources = preset.resources;
        this.calendar = preset.calendar;
      }
      DependencyEngine.scheduleProject(this.tasks, this.calendar);
      const wbsContainer = document.getElementById("wbs-pane");
      const ganttContainer = document.getElementById("gantt-pane");
      const milestonesContainer = document.getElementById("milestones-view-container");
      const resourceContainer = document.getElementById("resource-view-container");
      const deptreeContainer = document.getElementById("deptree-view-container");
      const infoGuideContainer = document.getElementById("info-guide-view-container");
      const calendarModalContainer = document.getElementById("calendar-modal-container");
      this.wbsView = new WbsGridView(wbsContainer, (taskId, action, value) => this.handleTaskChange(taskId, action, value), (taskId) => this.handleTaskSelect(taskId));
      this.ganttView = new GanttView(ganttContainer, (taskId) => this.handleGanttUpdate(taskId));
      this.milestonesView = new MilestonesView(milestonesContainer);
      this.deptreeView = new DependencyTreeView(deptreeContainer);
      this.infoGuideView = new InfoGuideView(infoGuideContainer);
      this.resourceView = new ResourceView(resourceContainer, (updatedRes) => {
        this.resources = updatedRes;
        this.renderAllViews();
      });
      this.calendarModalView = new CalendarModalView(calendarModalContainer, (updatedCal) => {
        this.calendar = updatedCal;
        DependencyEngine.scheduleProject(this.tasks, this.calendar);
        this.renderAllViews();
      });
      this.bindHeaderControls();
      this.initSplitPaneResizer();
      this.renderAllViews();
    }
    renderAllViews() {
      const titleInput = document.getElementById("project-title-input");
      if (titleInput) titleInput.value = this.projectTitle;
      const metrics = BaselineEngine.getProjectBaselineMetrics(this.tasks);
      const kpiBadge = document.getElementById("header-baseline-kpi");
      if (kpiBadge) {
        if (metrics.hasBaseline) {
          if (metrics.delayedTasksCount > 0) {
            kpiBadge.className = "px-2.5 py-1 bg-red-100 text-red-700 rounded font-semibold text-xs border border-red-300";
            kpiBadge.textContent = `Baseline: ${metrics.delayedTasksCount} tasks delayed (Max +${metrics.maxDelayDays}d)`;
          } else {
            kpiBadge.className = "px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold text-xs border border-emerald-300";
            kpiBadge.textContent = "Baseline: All tasks on schedule";
          }
        } else {
          kpiBadge.className = "px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-xs border border-slate-300";
          kpiBadge.textContent = "Baseline: Not Set";
        }
      }
      const splitContainer = document.getElementById("split-view-container");
      const milestonesContainer = document.getElementById("milestones-view-container");
      const resourceContainer = document.getElementById("resource-view-container");
      const deptreeContainer = document.getElementById("deptree-view-container");
      const infoGuideContainer = document.getElementById("info-guide-view-container");
      if (this.activeView === "split") {
        if (splitContainer) splitContainer.style.display = "flex";
        if (milestonesContainer) milestonesContainer.style.display = "none";
        if (resourceContainer) resourceContainer.style.display = "none";
        if (deptreeContainer) deptreeContainer.style.display = "none";
        if (infoGuideContainer) infoGuideContainer.style.display = "none";
        this.wbsView.render(this.tasks, this.resources);
        this.ganttView.render(this.tasks, this.calendar);
      } else if (this.activeView === "resources") {
        if (splitContainer) splitContainer.style.display = "none";
        if (milestonesContainer) milestonesContainer.style.display = "none";
        if (resourceContainer) resourceContainer.style.display = "block";
        if (deptreeContainer) deptreeContainer.style.display = "none";
        if (infoGuideContainer) infoGuideContainer.style.display = "none";
        this.resourceView.render(this.resources, this.tasks);
      } else if (this.activeView === "deptree") {
        if (splitContainer) splitContainer.style.display = "none";
        if (milestonesContainer) milestonesContainer.style.display = "none";
        if (resourceContainer) resourceContainer.style.display = "none";
        if (deptreeContainer) deptreeContainer.style.display = "block";
        if (infoGuideContainer) infoGuideContainer.style.display = "none";
        this.deptreeView.render(this.tasks);
      } else if (this.activeView === "info") {
        if (splitContainer) splitContainer.style.display = "none";
        if (milestonesContainer) milestonesContainer.style.display = "none";
        if (resourceContainer) resourceContainer.style.display = "none";
        if (deptreeContainer) deptreeContainer.style.display = "none";
        if (infoGuideContainer) infoGuideContainer.style.display = "block";
        this.infoGuideView.render();
      } else {
        if (splitContainer) splitContainer.style.display = "none";
        if (milestonesContainer) milestonesContainer.style.display = "block";
        if (resourceContainer) resourceContainer.style.display = "none";
        if (deptreeContainer) deptreeContainer.style.display = "none";
        if (infoGuideContainer) infoGuideContainer.style.display = "none";
        this.milestonesView.render(this.tasks);
      }
      ProjectStore.saveToLocalStorage(this.projectTitle, this.tasks, this.resources, this.calendar);
    }
    handleTaskChange(taskId, actionOrField, value) {
      if (!actionOrField) return;
      if (actionOrField === "add-task") {
        let parentId = null;
        let stage = "EVT";
        let workstream = "HW";
        let insertIndex = this.tasks.length;
        let startDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (this.selectedTaskId) {
          const selectedIndex = this.tasks.findIndex((t) => t.id === this.selectedTaskId);
          if (selectedIndex !== -1) {
            const selectedTask = this.tasks[selectedIndex];
            parentId = selectedTask.parentId || null;
            stage = selectedTask.stage || "EVT";
            workstream = selectedTask.workstream || "HW";
            startDate = selectedTask.start || startDate;
            insertIndex = selectedIndex + 1;
            while (insertIndex < this.tasks.length) {
              if (this.isDescendantOf(this.tasks[insertIndex], selectedTask.id)) {
                insertIndex++;
              } else {
                break;
              }
            }
          }
        } else if (this.tasks.length > 0) {
          const lastTask = this.tasks[this.tasks.length - 1];
          parentId = lastTask.parentId || null;
          stage = lastTask.stage || "EVT";
          workstream = lastTask.workstream || "HW";
          startDate = lastTask.start || startDate;
        }
        const newTask = new Task({
          name: "New Activity",
          stage,
          workstream,
          parentId,
          duration: 5,
          start: startDate
        });
        this.tasks.splice(insertIndex, 0, newTask);
        this.selectedTaskId = newTask.id;
      } else if (actionOrField === "indent" && taskId) {
        this.indentTask(taskId);
      } else if (actionOrField === "outdent" && taskId) {
        this.outdentTask(taskId);
      } else if (actionOrField === "delete" && taskId) {
        if (confirm("Delete selected activity and any subtasks?")) {
          this.deleteTaskRecursive(taskId);
        }
      } else {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          task[actionOrField] = value;
          if (actionOrField === "duration" || actionOrField === "start") {
            task.finish = task.calculateFinishDate(task.start, task.duration);
          }
        }
      }
      DependencyEngine.scheduleProject(this.tasks, this.calendar);
      this.renderAllViews();
    }
    isDescendantOf(candidateTask, ancestorId) {
      if (!candidateTask || !candidateTask.parentId) return false;
      let currentParentId = candidateTask.parentId;
      while (currentParentId) {
        if (currentParentId === ancestorId) return true;
        const parent = this.tasks.find((t) => t.id === currentParentId);
        currentParentId = parent ? parent.parentId : null;
      }
      return false;
    }
    handleGanttUpdate(taskId) {
      DependencyEngine.scheduleProject(this.tasks, this.calendar);
      this.renderAllViews();
    }
    handleTaskSelect(taskId) {
      this.selectedTaskId = taskId;
    }
    indentTask(taskId) {
      const index = this.tasks.findIndex((t) => t.id === taskId);
      if (index <= 0) return;
      const task = this.tasks[index];
      const prevTask = this.tasks[index - 1];
      if (prevTask) {
        task.parentId = prevTask.id;
        prevTask.isSummary = true;
        prevTask.expanded = true;
      }
    }
    outdentTask(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task || !task.parentId) return;
      const parent = this.tasks.find((t) => t.id === task.parentId);
      task.parentId = parent ? parent.parentId : null;
    }
    deleteTaskRecursive(taskId) {
      const toDelete = /* @__PURE__ */ new Set([taskId]);
      let added = true;
      while (added) {
        added = false;
        this.tasks.forEach((t) => {
          if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
            toDelete.add(t.id);
            added = true;
          }
        });
      }
      this.tasks = this.tasks.filter((t) => !toDelete.has(t.id));
    }
    bindHeaderControls() {
      const titleInput = document.getElementById("project-title-input");
      if (titleInput) {
        titleInput.onchange = (e) => {
          this.projectTitle = e.target.value;
          ProjectStore.saveToLocalStorage(this.projectTitle, this.tasks, this.resources, this.calendar);
        };
      }
      const btnSplit = document.getElementById("view-btn-split");
      const btnResources = document.getElementById("view-btn-resources");
      const btnDeptree = document.getElementById("view-btn-deptree");
      const btnMilestones = document.getElementById("view-btn-milestones");
      const btnInfo = document.getElementById("view-btn-info");
      const updateViewBtns = (active) => {
        this.activeView = active;
        [
          { btn: btnSplit, name: "split" },
          { btn: btnResources, name: "resources" },
          { btn: btnDeptree, name: "deptree" },
          { btn: btnMilestones, name: "milestones" },
          { btn: btnInfo, name: "info" }
        ].forEach((item) => {
          if (item.btn) {
            item.btn.className = item.name === active ? "px-3 py-1 bg-indigo-600 text-white rounded font-medium text-xs shadow-sm" : "px-3 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded font-medium text-xs";
          }
        });
        this.renderAllViews();
      };
      if (btnSplit) btnSplit.onclick = () => updateViewBtns("split");
      if (btnResources) btnResources.onclick = () => updateViewBtns("resources");
      if (btnDeptree) btnDeptree.onclick = () => updateViewBtns("deptree");
      if (btnMilestones) btnMilestones.onclick = () => updateViewBtns("milestones");
      if (btnInfo) btnInfo.onclick = () => updateViewBtns("info");
      const btnCalendarConfig = document.getElementById("btn-calendar-config");
      if (btnCalendarConfig) {
        btnCalendarConfig.onclick = () => {
          this.calendarModalView.render(this.calendar);
        };
      }
      const btnSetBaseline = document.getElementById("btn-set-baseline");
      if (btnSetBaseline) {
        btnSetBaseline.onclick = () => {
          if (confirm("Set current project schedule as target Baseline?")) {
            BaselineEngine.captureBaseline(this.tasks);
            this.renderAllViews();
          }
        };
      }
      const btnExportPrj = document.getElementById("btn-export-prj");
      if (btnExportPrj) {
        btnExportPrj.onclick = () => ProjectStore.exportProjectFile(this.projectTitle, this.tasks, this.resources, this.calendar);
      }
      const btnExportExcel = document.getElementById("btn-export-excel");
      if (btnExportExcel) {
        btnExportExcel.onclick = () => ExcelExporter.exportToExcel(this.projectTitle, this.tasks, this.resources, this.calendar);
      }
      const btnImportPrj = document.getElementById("btn-import-prj");
      const fileInput = document.getElementById("prj-file-input");
      if (btnImportPrj && fileInput) {
        btnImportPrj.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const imported = ProjectStore.importProjectFile(evt.target.result);
              if (imported) {
                this.projectTitle = imported.title;
                this.tasks = imported.tasks;
                this.resources = imported.resources;
                this.calendar = imported.calendar;
                this.renderAllViews();
              }
            };
            reader.readAsText(file);
          }
        };
      }
      const presetSelect = document.getElementById("preset-select");
      if (presetSelect) {
        presetSelect.onchange = (e) => {
          const presetId = e.target.value;
          if (!presetId) return;
          const loadPresetAction = () => {
            const preset = ProjectStore.getSamplePreset(presetId);
            if (preset) {
              this.projectTitle = preset.title;
              this.tasks = preset.tasks;
              this.resources = preset.resources;
              this.calendar = preset.calendar;
              this.renderAllViews();
            }
          };
          const saveFirst = confirm('WARNING: Creating a new project or loading a preset will replace current project data.\n\nClick "OK" to SAVE current project (.prj) first before proceeding, or "Cancel" to choose options.');
          if (saveFirst) {
            ProjectStore.exportProjectFile(this.projectTitle, this.tasks, this.resources, this.calendar);
            loadPresetAction();
          } else {
            if (confirm("Proceed to load new project WITHOUT saving current data?")) {
              loadPresetAction();
            }
          }
          e.target.value = "";
        };
      }
      const printSelect = document.getElementById("print-select");
      if (printSelect) {
        printSelect.onchange = (e) => {
          const target = e.target.value;
          if (target) {
            PrintEngine.printView(target);
            e.target.value = "";
          }
        };
      }
    }
    initSplitPaneResizer() {
      const resizer = document.getElementById("split-resizer");
      const leftPane = document.getElementById("wbs-pane");
      const container = document.getElementById("split-view-container");
      if (!resizer || !leftPane || !container) return;
      let isDragging = false;
      resizer.onmousedown = (e) => {
        isDragging = true;
        resizer.classList.add("is-dragging");
        document.body.style.cursor = "col-resize";
        document.onmousemove = (evt) => {
          if (!isDragging) return;
          const containerRect = container.getBoundingClientRect();
          const newLeftWidth = evt.clientX - containerRect.left;
          const clampedWidth = Math.max(300, Math.min(newLeftWidth, containerRect.width - 300));
          leftPane.style.width = `${clampedWidth}px`;
        };
        document.onmouseup = () => {
          isDragging = false;
          resizer.classList.remove("is-dragging");
          document.body.style.cursor = "default";
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new ProjectManagementApp();
    window.app.init();
  });
})();
