import React, { useState } from 'react';
import { 
  FileDown, 
  X, 
  Table2, 
  GanttChartSquare, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { ViewOption } from '../types';

export type ExportSectionChoice = 'all' | 'matrix' | 'gantt';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (section: ExportSectionChoice) => Promise<void>;
  activityCount: number;
  currentView: ViewOption;
  filterSummary: string[];
  isExporting: boolean;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  activityCount,
  currentView,
  filterSummary,
  isExporting
}) => {
  const [selectedSection, setSelectedSection] = useState<ExportSectionChoice>('all');

  if (!isOpen) return null;

  const handleExport = async () => {
    await onConfirmExport(selectedSection);
  };

  const options = [
    {
      id: 'all' as ExportSectionChoice,
      title: 'Full Master Report (Both)',
      tag: 'Recommended',
      description: 'Comprehensive export including both the Activity Matrix tables (Completed, Overdue, In Progress) and the Programme Gantt timeline.',
      icon: Layers,
      color: 'blue'
    },
    {
      id: 'matrix' as ExportSectionChoice,
      title: 'Action Matrix Only',
      tag: 'Tables & Deliverables',
      description: 'Structured task tables categorized into Completed, Overdue, and In-Progress/Planned with officer assignments, notes, and deadlines.',
      icon: Table2,
      color: 'emerald'
    },
    {
      id: 'gantt' as ExportSectionChoice,
      title: 'Programme Gantt Only',
      tag: 'Visual Timeline',
      description: 'Visual Gantt timeline grouped by work package across the active period with milestone tracking and progress bars.',
      icon: GanttChartSquare,
      color: 'indigo'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-blue-600/30 text-blue-400 rounded border border-blue-500/40">
                <FileDown className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Export PDF Report</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Radi Energy Solutions · Battery Plant Master WorkPlan
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Active scope info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>
                Scope: <strong className="text-slate-900">{currentView.name}</strong> ({activityCount} activities)
              </span>
            </div>
            {filterSummary.length > 0 ? (
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                {filterSummary.length} active filter{filterSummary.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                All Work Packages
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Document Sections to Export
            </label>

            <div className="space-y-2.5">
              {options.map((opt) => {
                const isSelected = selectedSection === opt.id;
                const IconComponent = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSection(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {opt.title}
                          </h4>
                          {opt.tag && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt.tag}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm border border-blue-600"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Export {selectedSection === 'all' ? 'Full Report' : selectedSection === 'matrix' ? 'Action Matrix' : 'Programme Gantt'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
