import React from 'react';
import { ViewOption } from '../types';
import { CalendarRange, Calendar, Layers } from 'lucide-react';

export const TIME_VIEWS: ViewOption[] = [
  { id: "overall", name: "Overall FY26/27", start: "2026-07-01", end: "2027-06-30", type: "months" },
  { id: "jul", name: "July 2026", start: "2026-07-01", end: "2026-07-31", type: "days" },
  { id: "aug", name: "August 2026", start: "2026-08-01", end: "2026-08-31", type: "days" },
  { id: "sep", name: "September 2026", start: "2026-09-01", end: "2026-09-30", type: "days" },
  { id: "oct", name: "October 2026", start: "2026-10-01", end: "2026-10-31", type: "days" },
  { id: "nov", name: "November 2026", start: "2026-11-01", end: "2026-11-30", type: "days" },
  { id: "dec", name: "December 2026", start: "2026-12-01", end: "2026-12-31", type: "days" },
  { id: "jan", name: "January 2027", start: "2027-01-01", end: "2027-01-31", type: "days" },
  { id: "feb", name: "February 2027", start: "2027-02-01", end: "2027-02-28", type: "days" },
  { id: "mar", name: "March 2027", start: "2027-03-01", end: "2027-03-31", type: "days" },
  { id: "apr", name: "April 2027", start: "2027-04-01", end: "2027-04-30", type: "days" },
  { id: "may", name: "May 2027", start: "2027-05-01", end: "2027-05-31", type: "days" },
  { id: "jun", name: "June 2027", start: "2027-06-01", end: "2027-06-30", type: "days" }
];

interface TimeViewTabsProps {
  currentViewId: string;
  onSelectView: (viewId: string) => void;
  selectedPackage?: string;
  workPackages?: string[];
  onSelectPackage?: (pkg: string) => void;
}

export const TimeViewTabs: React.FC<TimeViewTabsProps> = ({
  currentViewId,
  onSelectView,
  selectedPackage = "ALL",
  workPackages = [],
  onSelectPackage
}) => {
  return (
    <div className="relative z-20 flex flex-col shrink-0 bg-slate-900/65 backdrop-blur-md border-y border-white/10 shadow-md transition-all">
      {/* Primary Month Timeline Ribbon */}
      <div className="px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto dark-scrollbar select-none">
        {TIME_VIEWS.map((view) => {
          const isActive = view.id === currentViewId;
          const isOverall = view.id === "overall";

          if (isOverall) {
            return (
              <button
                key={view.id}
                onClick={() => onSelectView(view.id)}
                className={`py-1.5 px-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-lg transition-all flex items-center gap-1.5 border shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-300/60 font-black'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60 hover:text-amber-200'
                }`}
              >
                <CalendarRange className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-amber-400'}`} />
                {view.name}
              </button>
            );
          }

          return (
            <button
              key={view.id}
              onClick={() => onSelectView(view.id)}
              className={`py-1.5 px-3 text-xs uppercase tracking-wider whitespace-nowrap rounded-lg transition-all flex items-center gap-1.5 border shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 font-bold border-white shadow-md ring-2 ring-blue-500/40'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white font-medium border-slate-700/60'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {view.name}
            </button>
          );
        })}
      </div>

      {/* Work Package Quick-Filter Sub-Ribbon (if packages provided) */}
      {workPackages.length > 0 && onSelectPackage && (
        <div className="px-3 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto dark-scrollbar border-t border-white/5 bg-slate-950/40 select-none">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">
            <Layers className="w-3 h-3 text-blue-400" />
            <span className="hidden md:inline">Packages:</span>
          </div>

          <button
            onClick={() => onSelectPackage("ALL")}
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap transition-all border shrink-0 ${
              selectedPackage === "ALL"
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border-slate-700/50 hover:bg-slate-700/60'
            }`}
          >
            All Packages
          </button>

          {workPackages.map((wp) => {
            const isSelected = selectedPackage === wp;
            // Shorten "WP1: Corporate..." to "WP1: Corporate" if long
            const shortName = wp.length > 30 ? wp.substring(0, 28) + '...' : wp;
            return (
              <button
                key={wp}
                onClick={() => onSelectPackage(wp)}
                title={wp}
                className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-xs'
                    : 'bg-slate-800/40 text-slate-300 hover:text-white border-slate-700/40 hover:bg-slate-700/50'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
