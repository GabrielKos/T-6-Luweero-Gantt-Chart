import React from 'react';
import { FilterState } from '../types';
import { 
  SlidersHorizontal, 
  FolderOpen, 
  UserCheck, 
  Plus, 
  Share2, 
  Download, 
  Search, 
  AlertTriangle,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  leadOfficers: string[];
  workPackages: string[];
  onAddNewTask: () => void;
  onExport: () => void;
  onShareLink: () => void;
  isCopied: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  leadOfficers,
  workPackages,
  onAddNewTask,
  onExport,
  onShareLink,
  isCopied
}) => {
  return (
    <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border border-slate-800 m-2 sm:m-4 rounded-xl shadow-md relative overflow-hidden text-white shrink-0">
      {/* Subtle ambient highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Row in Filter Hub */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-white text-base sm:text-lg font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-400" />
            Interactive Workplan Controls
          </h2>
        </div>

        {/* Layout & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/90 rounded-lg p-1 border border-slate-700/80 shadow-inner">
            <button
              onClick={() => onFilterChange({ layout: 'timeline' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filters.layout === 'timeline' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Timeline View
            </button>
            <button
              onClick={() => onFilterChange({ layout: 'officer' })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filters.layout === 'officer' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Lead Officer View
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={onAddNewTask}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs border border-emerald-500"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>

          {/* Shareable Link Button */}
          <button
            onClick={onShareLink}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs border ${
              isCopied
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-slate-200'
            }`}
            title="Copy shareable link for team members"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
            {isCopied ? 'Link Copied!' : 'Share Link'}
          </button>

          {/* Export PDF / Print Button */}
          <button
            onClick={onExport}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs border border-blue-500"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Search Activity
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks or officer..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-400 transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Lead Officer */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Lead Officer
          </label>
          <select
            value={filters.lead}
            onChange={(e) => onFilterChange({ lead: e.target.value })}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
          >
            <option value="ALL">-- All Leads --</option>
            {leadOfficers.map((lead) => (
              <option key={lead} value={lead} className="bg-slate-900 text-slate-100">{lead}</option>
            ))}
          </select>
        </div>

        {/* Work Package */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Work Package
          </label>
          <select
            value={filters.package}
            onChange={(e) => onFilterChange({ package: e.target.value })}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
          >
            <option value="ALL">-- All Packages --</option>
            {workPackages.map((wp) => (
              <option key={wp} value={wp} className="bg-slate-900 text-slate-100">{wp}</option>
            ))}
          </select>
        </div>

        {/* Task Status */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Task Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-slate-100">-- All Statuses --</option>
            <option value="COMPLETED" className="bg-slate-900 text-slate-100">Completed</option>
            <option value="PENDING" className="bg-slate-900 text-slate-100">Pending</option>
            <option value="OVERDUE" className="bg-slate-900 text-slate-100">Overdue</option>
          </select>
        </div>

        {/* Critical Only Toggle */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Urgency Filter
          </label>
          <button
            onClick={() => onFilterChange({ isCriticalOnly: !filters.isCriticalOnly })}
            className={`w-full text-xs font-semibold rounded-lg px-3 py-1.5 transition-all flex items-center justify-center gap-1.5 border ${
              filters.isCriticalOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filters.isCriticalOnly ? 'text-white' : 'text-amber-400'}`} />
            {filters.isCriticalOnly ? 'Critical Only (Active)' : 'Show Critical Only'}
          </button>
        </div>
      </div>
    </div>
  );
};
