import { WBSTask } from '../types';

/**
 * Shared derivation layer for the Overall Progress page and both exports.
 *
 * Keeping these calculations in one place means the number on screen, the
 * number in the PNG and the number in the PDF can never drift apart.
 */

/** Commissioning of Plant (COP) target for the T-6 Luweero battery plant (December 2030). */
export const COP_TARGET = '2030-12-31';

/** Programme window (matches the "Overall FY26/27" time view). */
export const PROGRAMME_START = '2026-07-01';
export const PROGRAMME_END = '2027-06-30';

/**
 * Hex equivalents of the Tailwind classes used for each work package, so the
 * canvas and PDF renderers (which have no access to Tailwind) draw the exact
 * same colours the app shows on screen.
 */
export const WP_HEX: Record<string, string> = {
  'Business Case Development': '#3b82f6',        // blue-500
  'Corporate Formation & ESIA': '#a855f7',       // purple-500
  'Plant Design & Engineering': '#14b8a6',       // teal-500
  'Technology Transfer Agreement': '#f97316',    // orange-500
  'Construction, Tooling, & Furnishing': '#f59e0b', // amber-500
  'Human Capital Development': '#ec4899'         // pink-500
};

export const DEFAULT_WP_HEX = '#64748b'; // slate-500

/** App palette, shared by screen and export renderers. */
export const PALETTE = {
  ink: '#0f172a',        // slate-900
  ink2: '#1e293b',       // slate-800
  muted: '#64748b',      // slate-500
  line: '#e2e8f0',       // slate-200
  surface: '#f8fafc',    // slate-50
  blue: '#2563eb',       // blue-600
  blueLight: '#60a5fa',  // blue-400
  emerald: '#10b981',    // emerald-500
  emeraldDark: '#047857',// emerald-700
  amber: '#f59e0b',      // amber-500
  rose: '#e11d48',       // rose-600
  slate: '#94a3b8'       // slate-400
};

export type EffectiveStatus = 'COMPLETED' | 'OVERDUE' | 'IN_PROGRESS' | 'PENDING';

export function wpHex(wp: string): string {
  return WP_HEX[wp] || DEFAULT_WP_HEX;
}

/** Midnight-anchored ms for a YYYY-MM-DD string, in the browser's local zone. */
export function dayMs(dateString: string): number {
  return new Date(`${dateString}T00:00:00`).getTime();
}

/** Whole days from `from` to `to`; negative once `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayMs(to) - dayMs(from)) / 86400000);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * A task's status as it actually stands on the simulation date — a PENDING task
 * whose deadline has passed reads as OVERDUE everywhere in the UI, and an
 * uncompleted task already inside its window reads as IN_PROGRESS.
 */
export function effectiveStatus(task: WBSTask, simMs: number): EffectiveStatus {
  if (task.status === 'COMPLETED') return 'COMPLETED';
  if (task.endMs < simMs) return 'OVERDUE';
  if (task.startMs <= simMs) return 'IN_PROGRESS';
  return 'PENDING';
}

export interface StatusCounts {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export function countStatuses(tasks: WBSTask[], simMs: number): StatusCounts {
  const counts: StatusCounts = { total: tasks.length, completed: 0, inProgress: 0, pending: 0, overdue: 0 };
  tasks.forEach(t => {
    switch (effectiveStatus(t, simMs)) {
      case 'COMPLETED': counts.completed++; break;
      case 'OVERDUE': counts.overdue++; break;
      case 'IN_PROGRESS': counts.inProgress++; break;
      default: counts.pending++;
    }
  });
  return counts;
}

export interface PackageStat extends StatusCounts {
  wp: string;
  color: string;
  /** Completion percentage, 0–100. */
  pct: number;
  /** Share of the whole programme this package represents, 0–100. */
  share: number;
  /** Latest deadline in the package. */
  deadline: string;
  leads: string[];
}

/**
 * Per-work-package roll-up, ordered by the package's earliest start so the
 * list reads chronologically rather than alphabetically.
 */
export function packageStats(tasks: WBSTask[], simMs: number): PackageStat[] {
  const groups = new Map<string, WBSTask[]>();
  tasks.forEach(t => {
    const key = t.wp || 'Unassigned';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const total = tasks.length || 1;

  return Array.from(groups.entries())
    .map(([wp, items]) => {
      const counts = countStatuses(items, simMs);
      const leadCounts = new Map<string, number>();
      items.forEach(t => {
        if (t.lead) leadCounts.set(t.lead, (leadCounts.get(t.lead) || 0) + 1);
      });
      return {
        wp,
        color: wpHex(wp),
        ...counts,
        pct: counts.total ? Math.round((counts.completed / counts.total) * 100) : 0,
        share: Math.round((counts.total / total) * 1000) / 10,
        deadline: items.reduce((acc, t) => (t.deadline > acc ? t.deadline : acc), items[0].deadline),
        leads: Array.from(leadCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name),
        _start: Math.min(...items.map(t => t.startMs))
      } as PackageStat & { _start: number };
    })
    .sort((a: any, b: any) => a._start - b._start);
}

export interface OfficerStat {
  name: string;
  total: number;
  completed: number;
  overdue: number;
  pct: number;
}

export function officerStats(tasks: WBSTask[], simMs: number): OfficerStat[] {
  const groups = new Map<string, WBSTask[]>();
  tasks.forEach(t => {
    const key = t.lead || 'Unassigned';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });
  return Array.from(groups.entries())
    .map(([name, items]) => {
      const c = countStatuses(items, simMs);
      return {
        name,
        total: c.total,
        completed: c.completed,
        overdue: c.overdue,
        pct: c.total ? Math.round((c.completed / c.total) * 100) : 0
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Tasks that are overdue, or fall due within `windowDays`, most urgent first. */
export function attentionTasks(tasks: WBSTask[], simMs: number, windowDays = 14): WBSTask[] {
  const horizon = simMs + windowDays * 86400000;
  return tasks
    .filter(t => t.status !== 'COMPLETED' && t.endMs <= horizon)
    .sort((a, b) => a.endMs - b.endMs);
}

/** Month-by-month deadline load across the programme window. */
export function monthlyLoad(tasks: WBSTask[], simMs: number) {
  const buckets = new Map<string, { label: string; total: number; completed: number; overdue: number }>();
  const start = new Date(`${PROGRAMME_START}T00:00:00`);
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      total: 0,
      completed: 0,
      overdue: 0
    });
  }
  tasks.forEach(t => {
    const key = t.deadline.slice(0, 7);
    const b = buckets.get(key);
    if (!b) return;
    b.total++;
    const st = effectiveStatus(t, simMs);
    if (st === 'COMPLETED') b.completed++;
    else if (st === 'OVERDUE') b.overdue++;
  });
  return Array.from(buckets.values());
}

export interface ProgressSummary {
  counts: StatusCounts;
  pct: number;
  daysToCop: number;
  elapsedPct: number;
  packages: PackageStat[];
  officers: OfficerStat[];
  attention: WBSTask[];
  months: ReturnType<typeof monthlyLoad>;
}

export function buildSummary(tasks: WBSTask[], simulationDate: string): ProgressSummary {
  const simMs = dayMs(simulationDate);
  const counts = countStatuses(tasks, simMs);
  const totalSpan = dayMs(PROGRAMME_END) - dayMs(PROGRAMME_START);
  const elapsed = simMs - dayMs(PROGRAMME_START);

  return {
    counts,
    pct: counts.total ? Math.round((counts.completed / counts.total) * 100) : 0,
    daysToCop: daysBetween(simulationDate, COP_TARGET),
    elapsedPct: Math.max(0, Math.min(100, Math.round((elapsed / totalSpan) * 100))),
    packages: packageStats(tasks, simMs),
    officers: officerStats(tasks, simMs),
    attention: attentionTasks(tasks, simMs),
    months: monthlyLoad(tasks, simMs)
  };
}
