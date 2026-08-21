import React from 'react';
import { UserProfile, WBSTask } from '../types';
import { RadiLogo } from './RadiLogo';
import { isTaskOverdue } from '../lib/projectStats';
import {
  Calendar,
  AlertTriangle,
  Clock,
  ChevronRight,
  Users
} from 'lucide-react';

export type AppView = 'gantt' | 'progress';

interface HeaderProps {
  user: UserProfile | null;
  tasks: WBSTask[];
  simulationDate: string;
  isLiveEAT: boolean;
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onSimulationDateChange: (date: string) => void;
  onResetToLiveEAT: () => void;
  onOpenAuthModal: () => void;
  onOpenActivityLogs: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  isOverdueFilterActive?: boolean;
  onToggleOverdueFilter?: () => void;
}

/**
 * Single-row command bar.
 *
 * Everything lives on one 52px line: brand, view switch, live date, KPI chips, team.
 */
export const Header: React.FC<HeaderProps> = ({
  user,
  tasks,
  simulationDate,
  isLiveEAT,
  activeView,
  onChangeView,
  onSimulationDateChange,
  onResetToLiveEAT,
  onOpenAuthModal,
  onOpenActivityLogs,
  syncStatus,
  isOverdueFilterActive = false,
  onToggleOverdueFilter
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter(t => isTaskOverdue(t, simulationDate)).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const syncDot =
    syncStatus === 'synced' ? 'bg-emerald-500'
      : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse'
        : 'bg-rose-500';

  return (
    <header
      className="text-white shrink-0 border-b border-slate-800/70 z-30 relative"
      style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.12) 0%, rgba(2,6,23,0.5) 100%)' }}
    >
      <div className="h-[52px] flex items-center">

        {/* Brand: Always docked and pinned on the left */}
        <div className="flex items-center gap-2.5 shrink-0 pl-2.5 sm:pl-4 pr-2 z-10">
          <div className="bg-white rounded-full pl-2.5 pr-3 flex items-center h-9 shadow-sm shrink-0">
            <RadiLogo className="h-5" />
          </div>
          <div className="hidden lg:block leading-tight min-w-0">
            <div className="text-[12.5px] font-bold tracking-tight text-white truncate max-w-[230px] xl:max-w-none">
              Radi Energy Solutions Battery Plant Master WorkPlan
            </div>
            <div className="text-[9.5px] text-slate-400 font-medium tracking-wide truncate">
              Radi Energy Solutions · Master WorkPlan · FY26/27
            </div>
          </div>
        </div>

        {/* Scrollable Control Cluster: Allows smooth horizontal scrolling on mobile devices */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-3 overflow-x-auto dark-scrollbar py-1 pr-2.5 sm:pr-4">

          {/* View switch */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 shrink-0">
            <button
              onClick={() => onChangeView('gantt')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                activeView === 'gantt' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Workplan
            </button>
            <button
              onClick={() => onChangeView('progress')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                activeView === 'progress' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overall Progress
            </button>
          </div>

          <div className="hidden sm:flex flex-1 min-w-0" />

          {/* Simulation date */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 h-8 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="date"
              value={simulationDate}
              min="2026-01-01"
              max="2028-12-31"
              onChange={(e) => onSimulationDateChange(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-white focus:outline-none mono w-[104px] p-0 cursor-pointer [color-scheme:dark]"
              title="Simulation date (East Africa Time, UTC+3)"
            />
            {isLiveEAT ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Live EAT clock" />
            ) : (
              <button
                onClick={onResetToLiveEAT}
                className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                title="Sync to East Africa Time (UTC+3)"
              >
                Live
              </button>
            )}
          </div>

          {/* Completion chip */}
          <button
            onClick={() => onChangeView('progress')}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-blue-600 rounded-lg px-2.5 h-8 shrink-0 transition-colors group"
            title="Open the Overall Progress page"
          >
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Done</span>
            <span className="text-[12px] font-bold text-blue-400 mono">{completionPercentage}%</span>
            <span className="hidden sm:inline text-[10px] text-slate-500 mono">{completedTasks}/{totalTasks}</span>
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Overdue interactive toggle chip */}
          {overdueTasks > 0 && (
            <button
              onClick={() => {
                if (activeView !== 'gantt') onChangeView('gantt');
                if (onToggleOverdueFilter) onToggleOverdueFilter();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 h-8 shrink-0 transition-all font-bold cursor-pointer border ${
                isOverdueFilterActive
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                  : 'bg-rose-950/80 hover:bg-rose-900 border-rose-800 text-rose-200 hover:text-white'
              }`}
              title={isOverdueFilterActive ? "Showing overdue tasks only (click to clear filter)" : "Click to filter chart to overdue tasks only"}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isOverdueFilterActive ? 'text-white' : 'text-rose-400'} shrink-0`} />
              <span className="text-[11px] mono whitespace-nowrap">
                {overdueTasks}<span className="hidden sm:inline"> overdue</span>
              </span>
              {isOverdueFilterActive && (
                <span className="text-[9px] bg-rose-800 text-white px-1 py-0.2 rounded ml-0.5 uppercase tracking-wider font-extrabold">FILTERED</span>
              )}
            </button>
          )}

          {/* Team */}
          <button
            onClick={onOpenAuthModal}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 h-8 flex items-center gap-1.5 shrink-0 transition-colors"
            title="Team profile / sign in"
          >
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-100">Team</span>
          </button>

          {/* Activity log */}
          <button
            onClick={onOpenActivityLogs}
            className="relative bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg w-8 h-8 flex items-center justify-center shrink-0 transition-colors"
            title={`Team audit log · ${syncStatus}`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-950 ${syncDot}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
