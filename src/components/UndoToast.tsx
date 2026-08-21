import React, { useEffect, useState, useRef } from 'react';
import { WBSTask } from '../types';
import { Undo2, X, Trash2 } from 'lucide-react';

interface UndoToastProps {
  deletedTask: WBSTask | null;
  onUndo: (task: WBSTask) => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  deletedTask,
  onUndo,
  onDismiss,
  durationMs = 6000
}) => {
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!deletedTask) return;

    setProgress(100);
    const startTime = Date.now();
    const intervalTime = 50;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      const pct = (remaining / durationMs) * 100;
      
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onDismissRef.current();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [deletedTask?.id, durationMs]);

  if (!deletedTask) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden p-4 relative">
        {/* Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5 border border-rose-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Task Deleted
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {deletedTask.wp}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100 truncate mt-0.5" title={deletedTask.activity}>
                {deletedTask.activity}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lead: <span className="text-slate-200 font-medium">{deletedTask.lead}</span> · Due: {deletedTask.deadline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => onUndo(deletedTask)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-blue-500/20 active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
