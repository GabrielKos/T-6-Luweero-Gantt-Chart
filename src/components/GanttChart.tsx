import React, { useRef, useEffect, useState } from 'react';
import { WBSTask, ViewOption } from '../types';
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
  BarChart3
} from 'lucide-react';

interface GanttChartProps {
  tasks: WBSTask[];
  currentView: ViewOption;
  simulationDate: string;
  layout: 'timeline' | 'officer';
  onToggleTaskStatus: (taskId: string, currentStatus: WBSTask['status']) => void;
  onEditTask: (task: WBSTask) => void;
  onDeleteTask: (task: WBSTask) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  currentView,
  simulationDate,
  layout,
  onToggleTaskStatus,
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
    visibleTasks = tasks.filter(t => t.startMs <= viewEndMs && t.endMs >= viewStartMs);
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

  return (
    // No fill here — the left task list and right timeline canvas each set
    // their own translucency below. Filling this outer wrapper too would
    // stack on top of theirs and wash the plant photo back out almost
    // completely, which is the opposite of what we want.
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
            'w-[150px] sm:w-[260px] md:w-[320px] lg:w-[420px]'
          }`}
        >
          {/* Header */}
          <div className="flex bg-slate-100/93 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 sm:px-3 py-2.5 shrink-0 h-10 items-center">
            <div className="w-6 sm:w-8 text-center shrink-0">Done</div>
            <div className="flex-1 px-1 sm:px-2 truncate">Task Details</div>
            <div className="hidden sm:block w-20 text-right pr-2 shrink-0">Deadline</div>
            <div className="hidden sm:block w-12 text-center shrink-0">Action</div>
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
                      onToggleStatus={onToggleTaskStatus}
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
                  onToggleStatus={onToggleTaskStatus}
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
  onToggleStatus: (id: string, current: WBSTask['status']) => void;
  onEdit: (task: WBSTask) => void;
  onDelete: (task: WBSTask) => void;
}

const TaskRowItem: React.FC<TaskRowItemProps> = ({
  task,
  idx,
  simMs,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = !isCompleted && task.endMs < simMs;
  const isOdd = idx % 2 !== 0;

  let rowBg = isOdd ? 'bg-slate-50/92' : 'bg-white/93';
  if (isOverdue) rowBg = 'overdue-row bg-red-50/93';

  const dateSplit = task.deadline.split('-');
  const displayDl = `${dateSplit[2]}.${dateSplit[1]}.${dateSplit[0]}`;

  return (
    <div className={`flex gantt-row px-2.5 py-2 border-b border-slate-100 ${rowBg} h-[85px] items-center text-xs group`}>
      {/* Status Checkbox */}
      <div className="w-8 shrink-0 flex justify-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggleStatus(task.id, task.status)}
          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
        />
      </div>

      {/* Task Info */}
      <div className="flex-1 px-2 overflow-hidden h-full flex flex-col justify-center">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded ${task.style?.light || 'bg-slate-100'} ${task.style?.text || 'text-slate-700'}`}>
            {task.wp}
          </span>
          {task.priority === 'HIGH' && (
            <span className="text-[8px] bg-red-100 text-red-700 font-extrabold px-1 rounded uppercase">High</span>
          )}
        </div>

        <div className={`font-bold text-[11px] text-slate-800 leading-snug line-clamp-2 ${isCompleted ? 'line-through text-slate-400 font-medium' : ''}`}>
          {task.activity}
        </div>

        <div className="text-[9px] text-slate-500 mt-1 truncate" title={`Lead: ${task.lead} | Support: ${task.support}`}>
          <span className="font-semibold text-slate-400">Lead:</span> <span className="text-slate-700 font-bold">{task.lead}</span>
          <span className="mx-1 text-slate-300">|</span>
          <span className="font-semibold text-slate-400">Support:</span> {task.support || 'None'}
        </div>
      </div>

      {/* Deadline — small themed pill behind the date/status so it stays
          legible against the photo showing through the row background. */}
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
      <div className="hidden sm:flex w-12 shrink-0 items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
          title="Edit WBS Task"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600 transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* Component for individual Gantt Bar in Right Pane */
interface GanttBarItemProps {
  task: WBSTask;
  viewStartMs: number;
  totalMs: number;
  simMs: number;
}

const GanttBarItem: React.FC<GanttBarItemProps> = ({
  task,
  viewStartMs,
  totalMs,
  simMs
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = !isCompleted && task.endMs < simMs;

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

  let barBg = `${task.style?.bg || 'bg-slate-500'} ${task.style?.border || 'border-slate-600'} border`;
  let barText = 'text-white';

  if (isCompleted) {
    barBg = 'bg-emerald-50 border border-emerald-300 border-dashed opacity-85';
    barText = 'text-emerald-800 font-semibold';
  } else if (isOverdue) {
    barBg = 'bg-rose-600 border-rose-700 border shadow-xs';
  }

  return (
    <div className="relative w-full h-[85px] border-b border-slate-100 gantt-row group">
      {widthPct > 0 && leftPct < 100 && (
        <div
          className={`absolute top-4 bottom-4 rounded-md shadow-xs overflow-hidden flex items-center px-2.5 gantt-bar-wrapper cursor-pointer ${barBg}`}
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '28px' }}
          title={`${task.activity}\nWork Package: ${task.wp}\nLead: ${task.lead} (Support: ${task.support || 'None'})\nDeadline: ${task.deadline}\nStatus: ${isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}${task.notes ? `\nNotes: ${task.notes}` : ''}`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />}
          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-white mr-1.5 shrink-0 animate-pulse" />}

          <span className={`text-[9px] font-bold ${barText} truncate drop-shadow-xs tracking-wide`}>
            {widthPct > 10 ? task.activity : ''}
          </span>
        </div>
      )}
    </div>
  );
};
