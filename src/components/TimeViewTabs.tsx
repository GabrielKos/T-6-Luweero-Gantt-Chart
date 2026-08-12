import React from 'react';
import { ViewOption } from '../types';

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
    <div className="px-4 sm:px-6 flex gap-4 overflow-x-auto border-t border-b border-slate-200 bg-white shrink-0 scrollbar-none">
      {TIME_VIEWS.map((view) => {
        const isActive = view.id === currentViewId;
        return (
          <button
            key={view.id}
            onClick={() => onSelectView(view.id)}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
              isActive
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {view.name}
          </button>
        );
      })}
    </div>
  );
};
