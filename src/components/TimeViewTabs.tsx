import React from 'react';
import { ViewOption } from '../types';
import { CalendarRange, Calendar } from 'lucide-react';

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
}

export const TimeViewTabs: React.FC<TimeViewTabsProps> = ({ currentViewId, onSelectView }) => {
  return (
    <div className="px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto bg-slate-800 border-y border-slate-700/80 shrink-0 scrollbar-none shadow-inner">
      {TIME_VIEWS.map((view) => {
        const isActive = view.id === currentViewId;
        const isOverall = view.id === "overall";

        if (isOverall) {
          return (
            <button
              key={view.id}
              onClick={() => onSelectView(view.id)}
              className={`py-1.5 px-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-lg transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm ring-2 ring-amber-300/50'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
              }`}
            >
              <CalendarRange className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              {view.name}
            </button>
          );
        }

        return (
          <button
            key={view.id}
            onClick={() => onSelectView(view.id)}
            className={`py-1.5 px-3 text-xs uppercase tracking-wider whitespace-nowrap rounded-lg transition-all flex items-center gap-1 border ${
              isActive
                ? 'bg-white text-slate-900 font-bold border-slate-200 shadow-xs'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white font-medium border-slate-600/40'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
            {view.name}
          </button>
        );
      })}
    </div>
  );
};

