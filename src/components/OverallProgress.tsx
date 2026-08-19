import React, { useMemo } from 'react';
import { WBSTask } from '../types';
import { PLANT_BACKGROUND } from '../assets/plantBackground';
import {
  buildSummary,
  formatDate,
  COP_TARGET,
  PROGRAMME_START,
  PROGRAMME_END,
  PALETTE
} from '../lib/projectStats';
import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CircleDashed,
  Target,
  ImageDown,
  FileDown,
  CalendarClock,
  Users
} from 'lucide-react';

interface OverallProgressProps {
  tasks: WBSTask[];
  simulationDate: string;
  onExportPng: () => void;
  onExportPdf: () => void;
  isExporting: string | null;
}

/**
 * Overall Progress dashboard.
 *
 * Layout language is borrowed from the KMC implementation dashboard — a photo
 * background washed out behind frosted cards, a dominant progress tile beside a
 * dark countdown tile, then per-package bars — but recoloured to this app's
 * blue / slate / emerald palette rather than the KMC gold.
 */
export const OverallProgress: React.FC<OverallProgressProps> = ({
  tasks,
  simulationDate,
  onExportPng,
  onExportPdf,
  isExporting
}) => {
  const s = useMemo(() => buildSummary(tasks, simulationDate), [tasks, simulationDate]);

  const kpis = [
    { label: 'Completed', value: s.counts.completed, sub: 'activities signed off', color: PALETTE.emerald, Icon: CheckCircle2 },
    { label: 'In Progress', value: s.counts.inProgress, sub: 'inside their window', color: PALETTE.blue, Icon: Clock3 },
    { label: 'Pending', value: s.counts.pending, sub: 'not yet started', color: PALETTE.slate, Icon: CircleDashed },
    { label: 'Overdue', value: s.counts.overdue, sub: 'past deadline', color: PALETTE.rose, Icon: AlertTriangle }
  ];

  const maxMonth = Math.max(1, ...s.months.map(m => m.total));

  return (
    // The photo layers sit inside this box rather than behind the whole app —
    // the app root paints an opaque background, so a negative z-index here
    // would put the render behind it and hide it completely.
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${PLANT_BACKGROUND}")` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(2,6,23,.84) 0%, rgba(15,23,42,.70) 18%, rgba(241,245,249,.90) 42%, rgba(241,245,249,.96) 58%, rgba(241,245,249,.97) 100%)'
        }}
        aria-hidden="true"
      />

      <div
        id="progress-scroll"
        className="relative z-10 flex-1 min-h-0 overflow-y-auto max-w-full"
      >
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-5 pb-16">

        {/* ---------- Title strip ---------- */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300 font-bold mb-1">
              Programme Status
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Battery Plant — Overall Progress
            </h2>
            <div className="text-[11.5px] text-slate-300 mt-1">
              {formatDate(PROGRAMME_START)} – {formatDate(PROGRAMME_END)} · as at {formatDate(simulationDate)} (EAT)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportPng}
              disabled={!!isExporting}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-white disabled:opacity-60 backdrop-blur-sm border border-white/70 text-slate-800 text-xs font-bold rounded-lg px-3 py-2 shadow-sm transition-colors"
              title="Download a progress snapshot image"
            >
              <ImageDown className="w-4 h-4 text-blue-600" />
              {isExporting === 'png' ? 'Rendering…' : 'Snapshot PNG'}
            </button>
            <button
              onClick={onExportPdf}
              disabled={!!isExporting}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 border border-blue-400 text-white text-xs font-bold rounded-lg px-3 py-2 shadow-sm transition-colors"
              title="Download the complete Activity Matrix & Gantt PDF report"
            >
              <FileDown className="w-4 h-4" />
              {isExporting === 'pdf' ? 'Building…' : 'Action Matrix PDF'}
            </button>
          </div>
        </div>

        {/* ---------- Hero row: progress + SOP countdown ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 mb-3">
          <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-md shadow-lg p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[54px] sm:text-[64px] leading-none font-bold text-slate-900 tracking-tight">
                  {s.pct}<span className="text-3xl text-slate-400">%</span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-600 font-bold mt-2">
                  Overall Progress
                </div>
                <div className="text-[11.5px] text-slate-500 mt-1">
                  {s.counts.completed} of {s.counts.total} activities closed
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-bold">
                  Programme elapsed
                </div>
                <div className="text-2xl font-bold text-slate-700 mono mt-1">{s.elapsedPct}%</div>
                <div
                  className={`text-[11px] font-bold mt-1 ${
                    s.pct >= s.elapsedPct ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {s.pct >= s.elapsedPct
                    ? `${s.pct - s.elapsedPct} pts ahead of schedule`
                    : `${s.elapsedPct - s.pct} pts behind schedule`}
                </div>
              </div>
            </div>

            {/* Progress track with the elapsed-time marker */}
            <div className="relative mt-5 h-4 rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-[width] duration-500"
                style={{ width: `${s.pct}%` }}
              />
              <div
                className="absolute inset-y-0 w-[3px] bg-slate-900/70"
                style={{ left: `calc(${s.elapsedPct}% - 1.5px)` }}
                title={`Time elapsed: ${s.elapsedPct}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
              <span>{formatDate(PROGRAMME_START)}</span>
              <span className="text-slate-700 font-bold">▲ today {s.elapsedPct}%</span>
              <span>{formatDate(PROGRAMME_END)}</span>
            </div>
          </div>

          {/* COP countdown */}
          <div className="rounded-2xl border border-white/20 bg-slate-900/85 backdrop-blur-md shadow-lg p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-blue-300 font-bold">
                Days to COP
              </span>
            </div>
            <div className="text-[46px] leading-none font-bold text-white tracking-tight mono">
              {s.daysToCop}
            </div>
            <div className="text-[11.5px] text-slate-400 mt-3 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              Commissioning {formatDate(COP_TARGET)}
            </div>
          </div>
        </div>

        {/* ---------- KPI tiles ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {kpis.map(k => (
            <div
              key={k.label}
              className="relative rounded-xl border border-white/70 bg-white/85 backdrop-blur-md shadow-md p-4"
            >
              <span
                className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full ring-4 ring-white/60"
                style={{ background: k.color }}
              />
              <k.Icon className="w-4 h-4 mb-2" style={{ color: k.color }} />
              <div className="text-[9.5px] uppercase tracking-[0.1em] text-slate-500 font-bold">{k.label}</div>
              <div className="text-3xl font-bold text-slate-900 leading-tight mt-0.5">{k.value}</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ---------- Package progress + attention list ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-3 mb-3">

          {/* Work packages */}
          <div className="rounded-2xl border border-white/60 bg-white/85 backdrop-blur-md shadow-md p-5">
            <h3 className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-4">
              Progress by work package
            </h3>

            <div className="space-y-4">
              {s.packages.map(p => (
                <div key={p.wp}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
                      <span className="text-[12.5px] font-bold text-slate-800 truncate">{p.wp}</span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 hidden sm:inline">
                        {p.share}% of plan
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      {p.overdue > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
                          {p.overdue} overdue
                        </span>
                      )}
                      <span className="text-[13px] font-bold text-slate-900 mono tabular-nums">{p.pct}%</span>
                    </div>
                  </div>

                  {/* Stacked bar: completed / in-progress / overdue / pending */}
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                    <div style={{ width: `${(p.completed / p.total) * 100}%`, background: p.color }} />
                    <div
                      style={{
                        width: `${(p.inProgress / p.total) * 100}%`,
                        background: p.color,
                        opacity: 0.45
                      }}
                    />
                    <div style={{ width: `${(p.overdue / p.total) * 100}%`, background: PALETTE.rose }} />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>
                      {p.completed}/{p.total} closed
                      {p.inProgress > 0 && ` · ${p.inProgress} running`}
                    </span>
                    <span className="truncate ml-2">
                      {p.leads.join(', ')} · ends {formatDate(p.deadline)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-slate-700 inline-block" /> completed (package colour)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-slate-400 inline-block" /> in progress (faded)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-rose-500 inline-block" /> overdue
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-slate-100 border border-slate-200 inline-block" /> pending
              </span>
            </div>
          </div>

          {/* Attention required */}
          <div className="rounded-2xl border border-white/60 bg-white/85 backdrop-blur-md shadow-md p-5 flex flex-col min-h-0">
            <h3 className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3 flex items-center justify-between">
              <span>Attention required</span>
              <span className="text-slate-400 normal-case tracking-normal font-medium">
                next 14 days
              </span>
            </h3>

            <div className="overflow-y-auto max-h-[360px] -mr-2 pr-2">
              {s.attention.length === 0 ? (
                <div className="text-[12px] text-slate-500 py-6 text-center">
                  Nothing overdue or falling due in the next fortnight.
                </div>
              ) : (
                <ul className="space-y-2">
                  {s.attention.map(t => {
                    const d = Math.round((t.endMs - new Date(`${simulationDate}T00:00:00`).getTime()) / 86400000);
                    const late = d < 0;
                    return (
                      <li
                        key={t.id}
                        className={`rounded-lg border px-3 py-2 ${
                          late ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11.5px] font-bold text-slate-800 leading-snug">
                            {t.activity}
                          </span>
                          <span
                            className={`text-[10px] font-bold whitespace-nowrap mono shrink-0 ${
                              late ? 'text-rose-600' : d === 0 ? 'text-amber-600' : 'text-slate-500'
                            }`}
                          >
                            {late ? `${-d}d late` : d === 0 ? 'today' : `${d}d`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                          <span className="font-semibold" style={{ color: p_color(t.wp) }}>{t.wp}</span>
                          {' · '}{t.lead}{' · '}{formatDate(t.deadline)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Deadline load + officer load ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-3">

          {/* Monthly deadline load */}
          <div className="rounded-2xl border border-white/60 bg-white/85 backdrop-blur-md shadow-md p-5">
            <h3 className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-4">
              Deadline load by month
            </h3>
            <div className="flex items-end gap-1.5 h-[130px]">
              {s.months.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[9.5px] font-bold text-slate-600 mono">{m.total || ''}</span>
                  <div
                    className="w-full flex flex-col-reverse rounded-t overflow-hidden bg-slate-100"
                    style={{ height: `${(m.total / maxMonth) * 100}%`, minHeight: m.total ? 4 : 2 }}
                  >
                    <div
                      className="w-full bg-emerald-500"
                      style={{ height: `${m.total ? (m.completed / m.total) * 100 : 0}%` }}
                    />
                    <div
                      className="w-full bg-rose-500"
                      style={{ height: `${m.total ? (m.overdue / m.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[9.5px] text-slate-500 font-semibold">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> completed
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-rose-500 inline-block" /> overdue
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-3 h-2 rounded-sm bg-slate-200 inline-block" /> outstanding
              </span>
            </div>
          </div>

          {/* Lead officer load */}
          <div className="rounded-2xl border border-white/60 bg-white/85 backdrop-blur-md shadow-md p-5">
            <h3 className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-4 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Load by lead officer
            </h3>
            <div className="space-y-2.5">
              {s.officers.map(o => (
                <div key={o.name} className="grid grid-cols-[76px_1fr_54px] items-center gap-2.5">
                  <span className="text-[11.5px] font-bold text-slate-700 truncate">{o.name}</span>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-blue-600"
                      style={{ width: `${(o.completed / o.total) * 100}%` }}
                    />
                    <div
                      className="bg-rose-500"
                      style={{ width: `${(o.overdue / o.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-500 mono text-right tabular-nums">
                    {o.completed}/{o.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 mt-6">
          Radi Energy Solutions Battery Plant · Master WorkPlan · generated {formatDate(simulationDate)}
        </div>
      </div>
      </div>
    </div>
  );
};

/* Small helper so the attention list can tint the package label. */
function p_color(wp: string): string {
  const map: Record<string, string> = {
    'Business Case Development': '#2563eb',
    'Corporate Formation & ESIA': '#9333ea',
    'Plant Design & Engineering': '#0d9488',
    'Technology Transfer Agreement': '#ea580c',
    'Construction, Tooling, & Furnishing': '#d97706',
    'Human Capital Development': '#db2777'
  };
  return map[wp] || '#475569';
}
