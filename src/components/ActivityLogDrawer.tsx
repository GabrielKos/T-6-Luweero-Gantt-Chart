import React from 'react';
import { ActivityLog } from '../types';
import { X, Clock, CheckCircle2, PlusCircle, Edit3, Trash2, RefreshCw } from 'lucide-react';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  logs: ActivityLog[];
  onClose: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  logs,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const getActionIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CREATED':
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'UPDATED':
        return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'DELETED':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="text-sm font-bold">Team Activity Audit Log</h3>
                <p className="text-[10px] text-slate-400 font-medium">Live multi-user updates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No recent activity logged yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                    {getActionIcon(log.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-bold text-slate-900 truncate">
                        {log.user || 'Team Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 mono shrink-0 ml-2">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-semibold line-clamp-1">
                      {log.taskTitle || 'WBS Task'}
                    </div>

                    {log.details && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
