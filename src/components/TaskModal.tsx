import React, { useState, useEffect } from 'react';
import { WBSTask, WBSSubtask, TaskStatus, TaskPriority } from '../types';
import { CANONICAL_WORK_PACKAGES, WORK_PACKAGE_STYLES, TEAM_MEMBERS, canonicalizeWorkPackage } from '../data/initialTasks';
import { X, Save, Trash2, Calendar, User, FileText, CheckCircle2, ListChecks, Plus, Check, Users } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  task: WBSTask | null;
  onClose: () => void;
  onSave: (task: Partial<WBSTask> & { id?: string }) => Promise<void>;
  onDelete?: (task: WBSTask) => Promise<void> | void;
}

const COMMON_OFFICERS = [
  'Gabriel',
  'Druscillar',
  'Shibah',
  'Owen',
  'Morgan',
  'Elizabeth',
  'Karen',
  'Donald',
  'Malik',
  'Mukama',
  'Renorah',
  'Rodney'
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSave,
  onDelete
}) => {
  const [wp, setWp] = useState('Business Case Development');
  const [activity, setActivity] = useState('');
  const [lead, setLead] = useState('Shibah');
  const [support, setSupport] = useState('');
  const [deadline, setDeadline] = useState('2026-08-31');
  const [durationDays, setDurationDays] = useState(14);
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [notes, setNotes] = useState('');

  // Subtasks State
  const [subtasks, setSubtasks] = useState<WBSSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignees, setNewSubtaskAssignees] = useState('');

  useEffect(() => {
    if (task) {
      setWp(task.wp || 'Business Case Development');
      setActivity(task.activity || '');
      setLead(task.lead || 'Shibah');
      setSupport(task.support || '');
      setDeadline(task.deadline || '2026-08-31');
      setDurationDays(task.durationDays || 14);
      setStatus(task.status || 'PENDING');
      setPriority(task.priority || 'MEDIUM');
      setNotes(task.notes || '');
      setSubtasks(task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : []);
    } else {
      setWp('Business Case Development');
      setActivity('');
      setLead('Shibah');
      setSupport('');
      setDeadline('2026-08-31');
      setDurationDays(14);
      setStatus('PENDING');
      setPriority('MEDIUM');
      setNotes('');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setNewSubtaskAssignees('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  // Completion calculation
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const completionPct = hasSubtasks
    ? Math.round((completedSubtasksCount / subtasks.length) * 100)
    : (status === 'COMPLETED' ? 100 : 0);

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = newSubtaskTitle.trim();
    if (!trimmedTitle) return;

    const newSubtask: WBSSubtask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: trimmedTitle,
      assignees: newSubtaskAssignees.trim(),
      completed: false,
      createdAt: Date.now()
    };

    const nextSubtasks = [...subtasks, newSubtask];
    setSubtasks(nextSubtasks);
    setNewSubtaskTitle('');
    setNewSubtaskAssignees('');

    // If was completed, with a new uncompleted subtask it becomes IN_PROGRESS
    if (status === 'COMPLETED') {
      setStatus('IN_PROGRESS');
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });
    setSubtasks(updated);

    const allDone = updated.length > 0 && updated.every(s => s.completed);
    if (allDone) {
      setStatus('COMPLETED');
    } else if (status === 'COMPLETED') {
      setStatus('IN_PROGRESS');
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter(st => st.id !== subtaskId);
    setSubtasks(updated);
    if (updated.length > 0 && updated.every(s => s.completed)) {
      setStatus('COMPLETED');
    }
  };

  const handleToggleAssigneeChip = (name: string) => {
    const current = newSubtaskAssignees
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    if (current.includes(name)) {
      const filtered = current.filter(n => n !== name);
      setNewSubtaskAssignees(filtered.join(', '));
    } else {
      current.push(name);
      setNewSubtaskAssignees(current.join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    // Determine final status
    let finalStatus = status;
    if (subtasks.length > 0) {
      const allDone = subtasks.every(s => s.completed);
      if (allDone) {
        finalStatus = 'COMPLETED';
      } else if (finalStatus === 'COMPLETED') {
        finalStatus = 'IN_PROGRESS';
      }
    }

    const savePayload = {
      id: task?.id,
      wp,
      activity: activity.trim(),
      lead,
      support,
      deadline,
      durationDays,
      status: finalStatus,
      priority,
      notes,
      subtasks
    };

    onClose();
    try {
      onSave(savePayload);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = () => {
    if (!task?.id || !onDelete) return;
    onClose();
    try {
      onDelete(task);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const workPackages = CANONICAL_WORK_PACKAGES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {task ? 'Edit WBS Activity & Sub-tasks' : 'Create New WBS Task'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Radi Energy Solutions Battery Plant Master Workplan 2026–2027
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Work Package */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Work Package
            </label>
            <select
              value={wp}
              onChange={(e) => setWp(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {workPackages.map((packageTitle) => (
                <option key={packageTitle} value={packageTitle}>
                  {packageTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Main Task / Activity Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Develop the corporate formation and corporate Architecture Framework"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Officers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Lead Officer */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Lead Officer
              </label>
              <select
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <optgroup label="Primary Project Leads (3)">
                  <option value="Shibah">Shibah (Lead Engineer / Project Lead)</option>
                  <option value="Morgan">Morgan (Business & Financial Strategy)</option>
                  <option value="Owen">Owen (HSE & ESG Lead)</option>
                </optgroup>
                <optgroup label="Supporting Officers">
                  <option value="Elizabeth">Elizabeth (Financial Modeling)</option>
                  <option value="Karen">Karen (Competitive Intelligence)</option>
                  <option value="Gabriel">Gabriel (Digital Architecture)</option>
                  <option value="Donald">Donald (Legal & Corporate Formation)</option>
                  <option value="Druscilar">Druscilar (Market Research)</option>
                  <option value="Malik">Malik (Geopolitical & Sourcing)</option>
                  <option value="Mukama">Mukama (Technical Analyst)</option>
                  <option value="Renorah">Renorah (Plant Layout)</option>
                  <option value="Rodney">Rodney (Process Flow)</option>
                  <option value="Entire Project Team">Entire Project Team</option>
                </optgroup>
              </select>
            </div>

            {/* Support Officers */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Support Team / Officers
              </label>
              <input
                type="text"
                placeholder="e.g., Morgan, Gabriel, Renorah"
                value={support}
                onChange={(e) => setSupport(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Deadline (YYYY-MM-DD)
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Duration Days */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUBTASKS / MILESTONES SECTION (Concise & User-Friendly) */}
          {/* ======================================================== */}
          <div className="border border-blue-100 bg-slate-50/80 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Sub-Tasks Breakdown & Execution
                </span>
                {hasSubtasks && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {completedSubtasksCount} / {subtasks.length} Done ({completionPct}%)
                  </span>
                )}
              </div>
              {hasSubtasks && (
                <div className="w-28 sm:w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      completionPct === 100
                        ? 'bg-emerald-500'
                        : completionPct > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Break down this deliverable into sub-tasks with assigned team members. Sub-task completion automatically calculates the main task completion level bar.
            </p>

            {/* Existing Sub-tasks List */}
            {hasSubtasks && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all text-xs ${
                      st.completed
                        ? 'bg-emerald-50/80 border-emerald-200 text-slate-700'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold text-xs truncate ${st.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {st.title}
                        </div>
                        {st.assignees && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 truncate">
                            <Users className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-600 truncate">{st.assignees}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0 cursor-pointer"
                      title="Delete subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Sub-task Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Sub-Task
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Sub-task name (e.g. Market Survey of Consultants)..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Assignees Field & One-Click Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Assignees (Tap to toggle or type)
                  </label>
                  {newSubtaskAssignees && (
                    <button
                      type="button"
                      onClick={() => setNewSubtaskAssignees('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="e.g. Gabriel and Druscillar"
                  value={newSubtaskAssignees}
                  onChange={(e) => setNewSubtaskAssignees(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-1.5"
                />

                {/* Quick Officer Chips */}
                <div className="flex flex-wrap gap-1">
                  {COMMON_OFFICERS.map((officer) => {
                    const isSelected = newSubtaskAssignees
                      .toLowerCase()
                      .includes(officer.toLowerCase());
                    return (
                      <button
                        type="button"
                        key={officer}
                        onClick={() => handleToggleAssigneeChip(officer)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {officer}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleAddSubtask()}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Sub-task
                </button>
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Task Status
                </label>
                {hasSubtasks && (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {completionPct}% Complete
                  </span>
                )}
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes & Deliverables
            </label>
            <textarea
              rows={2}
              placeholder="Add key deliverables, technical specs, or review comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs border border-blue-600 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Activity</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
