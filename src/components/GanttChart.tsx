import React, { useRef, useEffect, useState } from 'react';
import { WBSTask, ViewOption, WBSSubtask } from '../types';
import { isTaskOverdue } from '../lib/projectStats';
import { 
  Check, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  UserCheck, 
  Info,
  Calendar,
  Clock,
  Layers,
  Columns,
  List,
  BarChart3,
  ListChecks,
  Plus,
  Users,
  ChevronDown,
  X
} from 'lucide-react';

interface GanttChartProps {
  tasks: WBSTask[];
  currentView: ViewOption;
  simulationDate: string;
  layout: 'timeline' | 'officer';
  onToggleTaskStatus: (taskId: string, currentStatus: WBSTask['status']) => void;
  onToggleSubtask?: (task: WBSTask, subtaskId: string) => void;
  onEditTask: (task: WBSTask) => void;
  onDeleteTask: (task: WBSTask) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  currentView,
  simulationDate,
  layout,
  onToggleTaskStatus,
  onToggleSubtask,
  onEditTask,
  onDeleteTask
}) => {
  const listScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Mobile Pane Focus Mode: 'split' | 'tasks' | 'timeline'
  const [mobilePane, setMobilePane] = useState<'split' | 'tasks' | 'timeline'>('split');

  const viewStartMs = new Date(`${currentView.start}T00:00:00`).getTime();
  const viewEndMs = new Date(`${currentView.end}T23:59:59`).getTime();
  const totalMs = viewEndMs - viewStartMs;
  const simMs = new Date(`${simulationDate}T12:00:00`).getTime();

  // Filter tasks within date window if specific month selected
  let visibleTasks = tasks;
  if (currentView.id !== 'overall') {
    visibleTasks = tasks.filter(t => 
      (t.startMs <= viewEndMs && t.endMs >= viewStartMs) ||
      (t.deadline >= currentView.start && t.deadline <= currentView.end)
    );
  }

  // Synchronize vertical scroll between left pane and right pane without feedback loops
  useEffect(() => {
    const listEl = listScrollRef.current;
    const timeEl = timelineScrollRef.current;
    if (!listEl || !timeEl) return;

    let isSyncing = false;

    const handleListScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      timeEl.scrollTop = listEl.scrollTop;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const handleTimeScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      listEl.scrollTop = timeEl.scrollTop;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    listEl.addEventListener('scroll', handleListScroll, { passive: true });
    timeEl.addEventListener('scroll', handleTimeScroll, { passive: true });

    return () => {
      listEl.removeEventListener('scroll', handleListScroll);
      timeEl.removeEventListener('scroll', handleTimeScroll);
    };
  }, []);

  // Reset scroll to top synchronously on view or filter/task change
  useEffect(() => {
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
    if (timelineScrollRef.current) timelineScrollRef.current.scrollTop = 0;
  }, [currentView.id, layout, visibleTasks.length]);

  // Group tasks if layout === 'officer'
  let groupedTasks: { lead: string; items: WBSTask[] }[] = [];
  if (layout === 'officer') {
    const groups: Record<string, WBSTask[]> = {};
    visibleTasks.forEach((t) => {
      const leadKey = t.lead || 'Unassigned';
      if (!groups[leadKey]) groups[leadKey] = [];
      groups[leadKey].push(t);
    });
    groupedTasks = Object.keys(groups).sort().map(lead => ({
      lead,
      items: groups[lead].sort((a, b) => a.endMs - b.endMs)
    }));
  }

  // Calculate Header Cells
  const headerCells: { label: string; widthPct: number }[] = [];
  if (currentView.type === 'days') {
    const year = parseInt(currentView.start.split('-')[0]);
    const month = parseInt(currentView.start.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayWidth = 100 / daysInMonth;

    for (let d = 1; d <= daysInMonth; d++) {
      headerCells.push({ label: `${d}`, widthPct: dayWidth });
    }
  } else {
    const monthsList = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthWidth = 100 / 12;
    monthsList.forEach(m => {
      headerCells.push({ label: m, widthPct: monthWidth });
    });
  }

  // Today line percentage
  const showTodayLine = simMs >= viewStartMs && simMs <= viewEndMs;
  const todayLeftPct = showTodayLine ? ((simMs - viewStartMs) / totalMs) * 100 : 0;
  const formattedSimDate = new Date(simMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Auto-scroll timeline horizontally so the Blue Day-Leader line is immediately in view
  useEffect(() => {
    const timeEl = timelineScrollRef.current;
    if (!timeEl) return;

    const snapToLeaderLine = (smooth: boolean) => {
      if (showTodayLine && timeEl) {
        const totalScrollWidth = timeEl.scrollWidth;
        const viewportWidth = timeEl.clientWidth;
        if (totalScrollWidth > viewportWidth) {
          const linePixelPos = (totalScrollWidth * todayLeftPct) / 100;
          // Position day-leader line ~30% from the left edge so current and upcoming tasks are prominently visible
          const targetScrollLeft = Math.max(0, linePixelPos - viewportWidth * 0.3);
          timeEl.scrollTo({ left: targetScrollLeft, behavior: smooth ? 'smooth' : 'auto' });
        }
      }
    };

    snapToLeaderLine(false);
    const timer = setTimeout(() => snapToLeaderLine(true), 120);

    return () => clearTimeout(timer);
  }, [currentView.id, simulationDate, showTodayLine, todayLeftPct, mobilePane]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      {/* Mobile Screen Navigation Bar (< 768px) */}
      <div className="md:hidden bg-slate-900 text-slate-200 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
          <Columns className="w-3 h-3 text-blue-400" /> View Focus:
        </span>
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => setMobilePane('split')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
              mobilePane === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" /> Split
          </button>
          <button
            onClick={() => setMobilePane('tasks')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
              mobilePane === 'tasks' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <List className="w-3 h-3" /> Tasks
          </button>
          <button
            onClick={() => setMobilePane('timeline')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
              mobilePane === 'timeline' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" /> Chart
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* ================= LEFT PANE: Task List ================= */}
        <div
          className={`shrink-0 bg-white/93 backdrop-blur-sm border-r border-slate-200 flex flex-col min-h-0 shadow-xs z-20 transition-all duration-200 ${
            mobilePane === 'timeline' ? 'hidden md:flex md:w-[320px] lg:w-[420px]' : 
            mobilePane === 'tasks' ? 'w-full md:w-[320px] lg:w-[420px]' : 
            'w-[160px] sm:w-[280px] md:w-[340px] lg:w-[420px]'
          }`}
        >
          {/* Header */}
          <div className="flex bg-slate-100/93 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 sm:px-3 py-2.5 shrink-0 h-10 items-center">
            <div className="w-6 sm:w-8 text-center shrink-0">Done</div>
            <div className="flex-1 px-1 sm:px-2 truncate">Task & Sub-Tasks</div>
            <div className="hidden sm:block w-20 text-right pr-2 shrink-0">Deadline</div>
            <div className="w-14 sm:w-16 text-center shrink-0">Action</div>
          </div>

          {/* List Content */}
          <div ref={listScrollRef} className="overflow-y-auto min-h-0 flex-1 custom-scrollbar pb-24 touch-pan-y">
            {visibleTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                No WBS tasks found.
              </div>
            ) : layout === 'officer' ? (
              // Officer Grouping
              groupedTasks.map((group) => (
                <React.Fragment key={group.lead}>
                  {/* Group Header */}
                  <div className="flex bg-slate-900/92 backdrop-blur-sm text-white h-10 items-center px-2.5 sm:px-3.5 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-30 shadow-xs truncate">
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-blue-500 shrink-0" />
                    <span className="truncate">Lead: {group.lead}</span>
                  </div>

                  {group.items.map((task, idx) => (
                    <TaskRowItem
                      key={task.id}
                      task={task}
                      idx={idx}
                      simMs={simMs}
                      simulationDate={simulationDate}
                      onToggleStatus={onToggleTaskStatus}
                      onToggleSubtask={onToggleSubtask}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  ))}
                </React.Fragment>
              ))
            ) : (
              // Standard Timeline List
              visibleTasks.map((task, idx) => (
                <TaskRowItem
                  key={task.id}
                  task={task}
                  idx={idx}
                  simMs={simMs}
                  simulationDate={simulationDate}
                  onToggleStatus={onToggleTaskStatus}
                  onToggleSubtask={onToggleSubtask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: Timeline Canvas ================= */}
        <div
          className={`flex-1 flex flex-col min-h-0 relative overflow-hidden bg-white/90 backdrop-blur-sm ${
            mobilePane === 'tasks' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Scrollable Timeline Container (both X and Y scrolling) */}
          <div 
            ref={timelineScrollRef} 
            className="flex-1 min-h-0 overflow-auto relative custom-scrollbar pb-24 touch-pan-x touch-pan-y"
          >
            <div className="min-w-[700px] sm:min-w-[1000px] relative min-h-full flex flex-col">
              {/* Header Scale (Days or Months) - Sticky Top */}
              <div className="sticky top-0 z-30 bg-slate-100/93 backdrop-blur-sm border-b border-slate-200 flex shrink-0 shadow-xs h-10 items-center">
                {headerCells.map((cell, i) => (
                  <div
                    key={i}
                    style={{ width: `${cell.widthPct}%` }}
                    className="text-center py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 shrink-0 uppercase tracking-wider"
                  >
                    {cell.label}
                  </div>
                ))}
              </div>

              {/* Chart Grid Lines & Bars */}
              <div className="relative min-w-full flex-1">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 pointer-events-none flex h-full">
                  {headerCells.map((cell, i) => (
                    <div
                      key={i}
                      style={{ width: `${cell.widthPct}%` }}
                      className="border-r border-slate-300/70 shrink-0 h-full"
                    />
                  ))}
                </div>

                {/* Simulation Today Line */}
                {showTodayLine && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-blue-600 z-20 leader-line pointer-events-none"
                    style={{ left: `${todayLeftPct}%` }}
                  >
                    <div className="sticky top-11 -translate-x-1/2 left-[1px] bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap uppercase tracking-wider flex items-center gap-1 border border-blue-500">
                      <Clock className="w-3 h-3 text-white animate-pulse" />
                      EAT: {formattedSimDate}
                    </div>
                  </div>
                )}

                {/* Gantt Bars List */}
                <div className="pt-0 z-10 relative min-w-full">
                  {layout === 'officer' ? (
                    groupedTasks.map((group) => (
                      <React.Fragment key={`gantt-group-${group.lead}`}>
                        {/* Empty spacer row for group header */}
                        <div className="w-full bg-slate-200/88 h-10 border-y border-slate-300 relative" />

                        {group.items.map((task) => (
                          <GanttBarItem
                            key={`bar-${task.id}`}
                            task={task}
                            viewStartMs={viewStartMs}
                            totalMs={totalMs}
                            simMs={simMs}
                            simulationDate={simulationDate}
                            onEdit={onEditTask}
                          />
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    visibleTasks.map((task) => (
                      <GanttBarItem
                        key={`bar-${task.id}`}
                        task={task}
                        viewStartMs={viewStartMs}
                        totalMs={totalMs}
                        simMs={simMs}
                        simulationDate={simulationDate}
                        onEdit={onEditTask}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Component for individual Task Row in Left Pane */
interface TaskRowItemProps {
  task: WBSTask;
  idx: number;
  simMs: number;
  simulationDate: string;
  onToggleStatus: (id: string, current: WBSTask['status']) => void;
  onToggleSubtask?: (task: WBSTask, subtaskId: string) => void;
  onEdit: (task: WBSTask) => void;
  onDelete: (task: WBSTask) => void;
}

const TaskRowItem: React.FC<TaskRowItemProps> = ({
  task,
  idx,
  simMs,
  simulationDate,
  onToggleStatus,
  onToggleSubtask,
  onEdit,
  onDelete
}) => {
  const [showSubtasksFlyout, setShowSubtasksFlyout] = useState(false);

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const completionPct = hasSubtasks
    ? Math.round((completedSubtasksCount / subtasks.length) * 100)
    : (task.status === 'COMPLETED' ? 100 : 0);

  const isCompleted = task.status === 'COMPLETED' || (hasSubtasks && completionPct === 100);
  const isOverdue = isTaskOverdue(task, simulationDate);
  const isOdd = idx % 2 !== 0;

  let rowBg = isOdd ? 'bg-slate-50/92' : 'bg-white/93';
  if (isOverdue) rowBg = 'overdue-row bg-red-50/93';

  const dateSplit = task.deadline.split('-');
  const displayDl = `${dateSplit[2]}.${dateSplit[1]}.${dateSplit[0]}`;

  return (
    <div className={`relative flex gantt-row px-2 sm:px-2.5 py-1.5 border-b border-slate-100 ${rowBg} h-[85px] items-center text-xs group`}>
      {/* Status Checkbox */}
      <div className="w-6 sm:w-8 shrink-0 flex justify-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggleStatus(task.id, task.status)}
          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
          title={hasSubtasks ? `Task has ${subtasks.length} subtasks (${completionPct}% done). Click to toggle all.` : 'Toggle task completion'}
        />
      </div>

      {/* Task Info */}
      <div className="flex-1 px-1.5 sm:px-2 overflow-hidden h-full flex flex-col justify-center">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded truncate max-w-[130px] sm:max-w-none ${task.style?.light || 'bg-slate-100'} ${task.style?.text || 'text-slate-700'}`}>
            {task.wp}
          </span>
          {task.priority === 'HIGH' && (
            <span className="text-[8px] bg-red-100 text-red-700 font-extrabold px-1 rounded uppercase">High</span>
          )}
        </div>

        <div className={`font-bold text-[11px] text-slate-800 leading-snug line-clamp-2 ${isCompleted ? 'line-through text-slate-400 font-medium' : ''}`}>
          {task.activity}
        </div>

        {/* Subtask level bar / quick pill underneath title */}
        {hasSubtasks ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-12 sm:w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverdue ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className={`text-[9px] font-extrabold tracking-tight ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
              {completedSubtasksCount}/{subtasks.length} ({completionPct}%)
            </span>
            <button
              type="button"
              onClick={() => setShowSubtasksFlyout(prev => !prev)}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 ml-auto flex items-center gap-0.5 cursor-pointer underline decoration-dotted"
            >
              {showSubtasksFlyout ? 'Hide' : `${subtasks.length} Sub-tasks`}
            </button>
          </div>
        ) : (
          <div className="text-[9px] text-slate-500 mt-0.5 truncate" title={`Lead: ${task.lead} | Support: ${task.support}`}>
            <span className="font-semibold text-slate-400">Lead:</span> <span className="text-slate-700 font-bold">{task.lead}</span>
            <span className="mx-1 text-slate-300">|</span>
            <span className="font-semibold text-slate-400">Support:</span> {task.support || 'None'}
          </div>
        )}
      </div>

      {/* Deadline */}
      <div className="hidden sm:block w-20 shrink-0 px-1 text-right text-[11px] font-bold mono">
        <span
          className={`inline-block px-1.5 py-0.5 rounded ${
            isCompleted
              ? 'bg-emerald-50/90 text-emerald-600'
              : isOverdue
                ? 'bg-red-50/90 text-red-600'
                : 'bg-slate-100/90 text-slate-600'
          }`}
        >
          {displayDl}
        </span>
        {isOverdue && (
          <div className="text-[8px] text-red-600 font-black uppercase tracking-wider mt-0.5 animate-pulse bg-red-50/90 rounded px-1 inline-block">
            Overdue
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex w-14 sm:w-16 shrink-0 items-center justify-center gap-0.5 opacity-90 sm:opacity-75 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
          title="Edit Task & Sub-tasks"
          aria-label="Edit Task"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
          title="Delete Task"
          aria-label="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Sub-tasks Flyout / Dropdown */}
      {showSubtasksFlyout && hasSubtasks && (
        <div className="absolute top-[82px] left-2 right-2 sm:right-auto sm:w-80 bg-white rounded-xl shadow-xl border border-slate-300 p-3 z-50 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ListChecks className="w-3.5 h-3.5 text-blue-600" />
              <span>Sub-tasks ({completedSubtasksCount}/{subtasks.length} Done)</span>
            </div>
            <button
              onClick={() => setShowSubtasksFlyout(false)}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {subtasks.map((st) => (
              <div
                key={st.id}
                className={`flex items-start gap-2 p-1.5 rounded-lg border text-[11px] ${
                  st.completed ? 'bg-emerald-50/70 border-emerald-200 text-slate-500' : 'bg-slate-50/70 border-slate-200 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => {
                    if (onToggleSubtask) onToggleSubtask(task, st.id);
                  }}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${st.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {st.title}
                  </div>
                  {st.assignees && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-600 truncate">{st.assignees}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowSubtasksFlyout(false);
                onEdit(task);
              }}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              Manage / Add in Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* Component for individual Gantt Bar in Right Pane with Completion Level Fill */
interface GanttBarItemProps {
  task: WBSTask;
  viewStartMs: number;
  totalMs: number;
  simMs: number;
  simulationDate: string;
  onEdit?: (task: WBSTask) => void;
}

const GanttBarItem: React.FC<GanttBarItemProps> = ({
  task,
  viewStartMs,
  totalMs,
  simMs,
  simulationDate,
  onEdit
}) => {
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const completionPct = hasSubtasks
    ? Math.round((completedSubtasksCount / subtasks.length) * 100)
    : (task.status === 'COMPLETED' ? 100 : 0);

  const isCompleted = task.status === 'COMPLETED' || (hasSubtasks && completionPct === 100);
  const isOverdue = isTaskOverdue(task, simulationDate);

  let leftPct = ((task.startMs - viewStartMs) / totalMs) * 100;
  let widthPct = ((task.endMs - task.startMs) / totalMs) * 100;

  if (leftPct < 0) {
    widthPct += leftPct;
    leftPct = 0;
  }
  if (leftPct + widthPct > 100) {
    widthPct = 100 - leftPct;
  }
  if (widthPct < 0.5) widthPct = 0.5;

  // Tooltip detailed breakdown
  const tooltipLines = [
    task.activity,
    `Work Package: ${task.wp}`,
    `Lead: ${task.lead} (Support: ${task.support || 'None'})`,
    `Deadline: ${task.deadline}`,
    `Status: ${isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'In Progress'}${hasSubtasks ? ` (${completionPct}% complete)` : ''}`,
    hasSubtasks ? `\nSub-tasks Breakdown (${completedSubtasksCount}/${subtasks.length}):\n` + subtasks.map(s => `  ${s.completed ? '✓' : '○'} ${s.title}${s.assignees ? ` [${s.assignees}]` : ''}`).join('\n') : '',
    task.notes ? `\nNotes: ${task.notes}` : ''
  ].filter(Boolean).join('\n');

  /* ========================================================================= */
  /* COLOR AND FILL LEVEL ARCHITECTURE:                                        */
  /* - If Overdue: Everything turns RED (outer red warning track), and the     */
  /*   completion fill bar fills completionPct% with solid vivid crimson red.  */
  /* - If Completed: Emerald solid bar (100%).                                 */
  /* - If In Progress / Pending: Outer track shows package outline, and the    */
  /*   inner fill level bar fills completionPct% with vibrant package color.   */
  /* ========================================================================= */

  let containerClasses = '';
  let fillClasses = '';
  let textClasses = 'text-white';

  if (isOverdue) {
    // Everything turns red, but still able to clearly see the bar fill level!
    // Outer shell: Dark warning red track with bright red border
    containerClasses = 'bg-red-950/85 border-2 border-red-600 shadow-md';
    // Fill level: Solid bright vivid red
    fillClasses = 'bg-red-600';
    textClasses = 'text-white font-bold drop-shadow-xs';
  } else if (isCompleted) {
    // 100% Complete: Emerald theme
    containerClasses = 'bg-emerald-600 border border-emerald-500 shadow-xs';
    fillClasses = 'bg-emerald-500';
    textClasses = 'text-white font-semibold drop-shadow-xs';
  } else {
    // Normal In-Progress / Pending task
    // Outer shell: deep translucent container showing remaining pending portion
    containerClasses = 'bg-slate-700/80 border border-slate-600 shadow-xs';
    // Fill level: Work Package brand color
    fillClasses = task.style?.bg || 'bg-blue-600';
    textClasses = 'text-white font-medium drop-shadow-xs';
  }

  return (
    <div className="relative w-full h-[85px] border-b border-slate-100 gantt-row group">
      {widthPct > 0 && leftPct < 100 && (
        <div
          onClick={() => onEdit && onEdit(task)}
          className={`absolute top-3.5 bottom-3.5 rounded-lg overflow-hidden flex items-center gantt-bar-wrapper cursor-pointer transition-all hover:scale-[1.008] hover:shadow-lg ${containerClasses}`}
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '32px' }}
          title={tooltipLines}
        >
          {/* Internal Completion Level Bar */}
          <div
            className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out ${fillClasses}`}
            style={{ width: `${isCompleted ? 100 : completionPct}%` }}
          />

          {/* Pending zone subtle texture for overdue / in-progress tasks with subtasks */}
          {hasSubtasks && completionPct < 100 && (
            <div
              className="absolute top-0 bottom-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.07)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.07)_50%,rgba(255,255,255,0.07)_75%,transparent_75%,transparent)] bg-[length:10px_10px] pointer-events-none"
              style={{ width: `${100 - completionPct}%` }}
            />
          )}

          {/* Foreground Content: Title, Badges, and Percentage Level */}
          <div className="relative z-10 flex items-center justify-between w-full px-2.5 min-w-0">
            <div className="flex items-center min-w-0 gap-1.5 flex-1 pr-1">
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-white shrink-0 drop-shadow-xs" />
              ) : isOverdue ? (
                <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0 animate-pulse drop-shadow-xs" />
              ) : null}

              <span className={`text-[9.5px] truncate tracking-wide ${textClasses}`}>
                {widthPct > 8 ? task.activity : ''}
              </span>
            </div>

            {/* Completion Percentage Badge / Subtasks pill */}
            {hasSubtasks && widthPct > 16 && (
              <span className={`shrink-0 ml-1 px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wide border shadow-2xs ${
                isOverdue 
                  ? 'bg-red-900/90 text-red-100 border-red-500' 
                  : isCompleted 
                  ? 'bg-emerald-700/80 text-emerald-100 border-emerald-400' 
                  : 'bg-slate-900/70 text-slate-200 border-slate-600'
              }`}>
                {completedSubtasksCount}/{subtasks.length} • {completionPct}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
