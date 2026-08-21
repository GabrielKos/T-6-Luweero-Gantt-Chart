import React, { useState, useEffect } from 'react';
import { WBSTask, TaskStatus, TaskPriority } from '../types';
import { CANONICAL_WORK_PACKAGES, WORK_PACKAGE_STYLES, TEAM_MEMBERS, canonicalizeWorkPackage } from '../data/initialTasks';
import { X, Save, Trash2, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  task: WBSTask | null;
  onClose: () => void;
  onSave: (task: Partial<WBSTask> & { id?: string }) => Promise<void>;
  onDelete?: (task: WBSTask) => Promise<void> | void;
}

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
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    const savePayload = {
      id: task?.id,
      wp,
      activity,
      lead,
      support,
      deadline,
      durationDays,
      status,
      priority,
      notes
    };

    // Close the portal immediately and dispatch save optimistically (0ms lag)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {task ? 'Edit WBS Activity' : 'Create New WBS Task'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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
              Task / Activity Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Develop Plant Design Basis & Philosophy"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Officers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.role.split('/')[0]})
                  </option>
                ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Task Status
              </label>
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
              rows={3}
              placeholder="Add key deliverables, technical specs, or review comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
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
