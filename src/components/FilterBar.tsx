import React, { useState } from 'react';
import { FilterState } from '../types';
import { 
  SlidersHorizontal, 
  FolderOpen, 
  UserCheck, 
  Users,
  Plus, 
  Share2,
  FileDown,
  ImageDown,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  leadOfficers: string[];
  supportingMembers?: string[];
  workPackages: string[];
  onAddNewTask: () => void;
  onExport: () => void;
  onExportPng: () => void;
  onShareLink: () => void;
  isCopied: boolean;
  /** Which export is currently running ('pdf' | 'png' | null). */
  isExporting?: string | null;
  /** How many activities the PDF will contain, given the active filters. */
  exportCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  leadOfficers,
  supportingMembers = [],
  workPackages,
  onAddNewTask,
  onExport,
  onExportPng,
  onShareLink,
  isCopied,
  isExporting = null,
  exportCount = 0
}) => {
  // Collapsible state: compact by default on small screens (<768px)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  const isFiltered = filters.searchQuery || filters.lead !== 'ALL' || filters.support !== 'ALL' || filters.package !== 'ALL' || filters.isCriticalOnly;

  return (
    <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-slate-900/85 via-slate-900/85 to-blue-950/85 border border-slate-800 m-1.5 sm:m-3 rounded-xl shadow-md relative text-white shrink-0">
      {/* Ambient highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Row */}
      <div className="relative z-10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-white hover:text-blue-300 font-bold text-xs sm:text-sm transition-colors py-1 px-1.5 rounded-lg hover:bg-slate-800/80"
            title={isExpanded ? "Collapse Controls" : "Expand Controls"}
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <span>Interactive Controls</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {!isExpanded && isFiltered && (
            <span className="text-[10px] bg-blue-600/80 text-white font-semibold px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Add Task Button */}
          <button
            onClick={onAddNewTask}
            className="px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-xs border border-emerald-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add Task</span>
          </button>

          {/* Shareable Link Button */}
          <button
            onClick={onShareLink}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-xs border ${
              isCopied
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-slate-200'
            }`}
            title="Copy shareable link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Progress Snapshot (PNG) */}
          <button
            onClick={onExportPng}
            disabled={!!isExporting}
            className="px-2.5 sm:px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-100 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-xs border border-slate-700"
            title="Download a PNG of overall progress, days to COP and each work package"
          >
            {isExporting === 'png'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              : <ImageDown className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          {/* Action Matrix (PDF) — respects the active filters and period */}
          <button
            onClick={onExport}
            disabled={!!isExporting}
            className="px-2.5 sm:px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-xs border border-blue-500"
            title={`Export the ${exportCount} filtered activities as a landscape PDF with a compressed Gantt`}
          >
            {isExporting === 'pdf'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileDown className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Export PDF</span>
            {exportCount > 0 && (
              <span className="hidden md:inline text-[10px] bg-blue-800/70 rounded px-1 ml-0.5 mono">
                {exportCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Controls Grid */}
      {isExpanded && (
        <div className="relative z-10 pt-3 mt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 animate-in fade-in duration-150">
          {/* View Mode Toggle */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              View Layout
            </label>
            <div className="flex bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80">
              <button
                onClick={() => onFilterChange({ layout: 'timeline' })}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                  filters.layout === 'timeline' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3 h-3" /> Timeline
              </button>
              <button
                onClick={() => onFilterChange({ layout: 'officer' })}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                  filters.layout === 'officer' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" /> Lead Officer
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg pl-8 pr-2 py-1 focus:outline-none focus:border-blue-400 transition-colors placeholder:text-slate-500"
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
              className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
            >
              <option value="ALL">-- All Leads --</option>
              {leadOfficers.map((lead) => (
                <option key={lead} value={lead} className="bg-slate-900 text-slate-100">{lead}</option>
              ))}
            </select>
          </div>

          {/* Supporting Member */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Supporting Member
            </label>
            <select
              value={filters.support || 'ALL'}
              onChange={(e) => onFilterChange({ support: e.target.value })}
              className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
            >
              <option value="ALL">-- All Support --</option>
              {supportingMembers.map((member) => (
                <option key={member} value={member} className="bg-slate-900 text-slate-100">{member}</option>
              ))}
            </select>
          </div>

          {/* Work Package */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Package
            </label>
            <select
              value={filters.package}
              onChange={(e) => onFilterChange({ package: e.target.value })}
              className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
            >
              <option value="ALL">-- All Packages --</option>
              {workPackages.map((wp) => (
                <option key={wp} value={wp} className="bg-slate-900 text-slate-100">{wp}</option>
              ))}
            </select>
          </div>

          {/* Critical Only Toggle */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Urgency
            </label>
            <button
              onClick={() => onFilterChange({ isCriticalOnly: !filters.isCriticalOnly })}
              className={`w-full text-xs font-semibold rounded-lg px-2 py-1 transition-all flex items-center justify-center gap-1 border ${
                filters.isCriticalOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <AlertTriangle className={`w-3 h-3 ${filters.isCriticalOnly ? 'text-white' : 'text-amber-400'}`} />
              {filters.isCriticalOnly ? 'Critical Only' : 'All Tasks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

