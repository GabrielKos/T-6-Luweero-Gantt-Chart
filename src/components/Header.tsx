import React from 'react';
import { UserProfile, WBSTask } from '../types';
import { KmcLogo } from './KmcLogo';
import { 
  Database, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  UserCheck, 
  Clock,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  tasks: WBSTask[];
  simulationDate: string;
  isLiveEAT: boolean;
  onSimulationDateChange: (date: string) => void;
  onResetToLiveEAT: () => void;
  onOpenAuthModal: () => void;
  onOpenActivityLogs: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  user,
  tasks,
  simulationDate,
  isLiveEAT,
  onSimulationDateChange,
  onResetToLiveEAT,
  onOpenAuthModal,
  onOpenActivityLogs,
  syncStatus
}) => {
  // Calculate KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const simMs = new Date(`${simulationDate}T00:00:00`).getTime();
  const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.endMs < simMs).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <header className="bg-white shrink-0 border-b border-slate-200 z-30 shadow-xs">
      {/* Top Branding & Status Bar */}
      <div className="px-4 sm:px-8 py-3.5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* KMC Approved Logo Badge */}
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs flex items-center justify-center h-11 min-w-[110px]">
            <KmcLogo className="h-7" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">T-6 Luwero Park</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
              Battery Pack Plant Master Workplan
            </h1>
          </div>
        </div>

        {/* Status Badges & Auth */}
        <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center w-full lg:w-auto">
          {/* Simulation Date Picker */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5 text-slate-800 shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none mb-0.5 flex items-center justify-between gap-1.5">
                <span>Simulation Date</span>
                <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-1 rounded flex items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveEAT ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  EAT (UTC+3)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="date" 
                  value={simulationDate} 
                  min="2026-01-01" 
                  max="2028-12-31" 
                  onChange={(e) => onSimulationDateChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none mono w-28 p-0 cursor-pointer"
                />
                {!isLiveEAT && (
                  <button
                    onClick={onResetToLiveEAT}
                    className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded transition-colors shadow-2xs whitespace-nowrap"
                    title="Sync to East Africa UTC+3 Live Clock"
                  >
                    Sync Live
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Global KPI */}
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2.5 shadow-xs">
            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none mb-0.5">Task Completion</div>
              <div className="text-xs font-bold text-blue-600 mono leading-none flex items-center gap-1.5">
                <span>{completionPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-normal">({completedTasks}/{totalTasks})</span>
              </div>
            </div>
          </div>

          {/* Overdue Badge */}
          {overdueTasks > 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <div>
                <div className="text-[9px] uppercase tracking-wider text-rose-600 font-bold leading-none mb-0.5">Alerts</div>
                <div className="text-xs font-bold mono leading-none">{overdueTasks} Overdue</div>
              </div>
            </div>
          )}

          {/* User Auth Profile Trigger */}
          <button
            onClick={onOpenAuthModal}
            className="ml-auto lg:ml-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-semibold transition-all shadow-sm border border-slate-800"
            title="Manage Team Profile / Sign In"
          >
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center uppercase">
              {user?.displayName ? user.displayName.substring(0, 2) : 'KM'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-semibold text-slate-100 leading-none truncate max-w-[110px]">
                {user?.displayName || 'Team Member'}
              </div>
              <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                {user?.role || 'KMC Engineer'}
              </div>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Activity Log Drawer Trigger */}
          <button
            onClick={onOpenActivityLogs}
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg p-2 flex items-center justify-center transition-colors shadow-xs"
            title="View Real-Time Team Audit Logs"
          >
            <Clock className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
