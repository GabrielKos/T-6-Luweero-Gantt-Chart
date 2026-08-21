import { WBSTask } from '../types';
import { canonicalizeWorkPackage } from '../data/initialTasks';

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
  'Business Case Development': '#3b82f6',                          // blue-500
  'Corporate Formation & ESIA': '#a855f7',                         // purple-500
  'Plant Design & Engineering Specifications of the Plant': '#14b8a6', // teal-500
  'Technology Transfer Agreement': '#f97316',                      // orange-500
  'Construction, Tooling, and Furnishing of the Plant': '#f59e0b', // amber-500
  'Human Capital Development': '#ec4899'                           // pink-500
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
  const canonical = canonicalizeWorkPackage(wp);
  return WP_HEX[canonical] || DEFAULT_WP_HEX;
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
 * Checks whether a task is overdue relative to a given simulation date (YYYY-MM-DD)
 */
export function isTaskOverdue(task: WBSTask, simulationDate: string): boolean {
  if (task.status === 'COMPLETED') return false;
  if (!task.deadline) return false;
  if (task.deadline < simulationDate) return true;
  const simMs = dayMs(simulationDate);
  return task.endMs < simMs;
}

/**
 * A task's status as it actually stands on the simulation date — a PENDING task
 * whose deadline has passed reads as OVERDUE everywhere in the UI, and an
 * uncompleted task already inside its window reads as IN_PROGRESS.
 */
export function effectiveStatus(task: WBSTask, simDateOrMs: string | number): EffectiveStatus {
  if (task.status === 'COMPLETED') return 'COMPLETED';

  let simDate = '';
  let simMs = 0;
  if (typeof simDateOrMs === 'string') {
    simDate = simDateOrMs;
    simMs = dayMs(simDate);
  } else {
    simMs = simDateOrMs;
    const d = new Date(simMs);
    simDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  if (task.deadline && task.deadline < simDate) return 'OVERDUE';
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

export function countStatuses(tasks: WBSTask[], simDateOrMs: string | number): StatusCounts {
  const counts: StatusCounts = { total: tasks.length, completed: 0, inProgress: 0, pending: 0, overdue: 0 };
  tasks.forEach(t => {
    switch (effectiveStatus(t, simDateOrMs)) {
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
export function packageStats(tasks: WBSTask[], simDateOrMs: string | number): PackageStat[] {
  const groups = new Map<string, WBSTask[]>();
  tasks.forEach(t => {
    const key = canonicalizeWorkPackage(t.wp || 'Unassigned');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const total = tasks.length || 1;

  return Array.from(groups.entries())
    .map(([wp, items]) => {
      const counts = countStatuses(items, simDateOrMs);
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
  inProgress: number;
  pending: number;
  overdue: number;
  pct: number;
  isLeader?: boolean;
}

export const CANONICAL_LEADERS = ['Shibah', 'Morgan', 'Owen'] as const;

export const ALL_CANONICAL_OFFICERS = [
  'Shibah',
  'Morgan',
  'Owen',
  'Elizabeth',
  'Karen',
  'Gabriel',
  'Donald',
  'Druscilar',
  'Malik',
  'Mukama',
  'Renorah',
  'Rodney'
] as const;

export function leadOfficerStats(tasks: WBSTask[], simDateOrMs: string | number): OfficerStat[] {
  return CANONICAL_LEADERS.map(name => {
    const items = tasks.filter(t => t.lead?.toLowerCase().trim() === name.toLowerCase());
    const c = countStatuses(items, simDateOrMs);
    return {
      name,
      total: c.total,
      completed: c.completed,
      inProgress: c.inProgress,
      pending: c.pending,
      overdue: c.overdue,
      pct: c.total ? Math.round((c.completed / c.total) * 100) : 0,
      isLeader: true
    };
  }).sort((a, b) => b.total - a.total);
}

export function supportOfficerStats(tasks: WBSTask[], simDateOrMs: string | number): OfficerStat[] {
  // Extract all supporting officers from list + canonical supporting team
  const canonicalSupporting = ALL_CANONICAL_OFFICERS.filter(name => !CANONICAL_LEADERS.includes(name as any));
  const dynamicSupporting = new Set<string>(canonicalSupporting);

  tasks.forEach(t => {
    if (t.support) {
      t.support.split(',').forEach(s => {
        const clean = s.trim();
        if (clean && clean.toLowerCase() !== 'none' && clean.toLowerCase() !== 'all members' && clean.toLowerCase() !== 'all' && !CANONICAL_LEADERS.includes(clean as any)) {
          dynamicSupporting.add(clean);
        }
      });
    }
  });

  return Array.from(dynamicSupporting).map(name => {
    const items = tasks.filter(t => {
      if (!t.support) return false;
      return t.support.toLowerCase().includes(name.toLowerCase());
    });
    const c = countStatuses(items, simDateOrMs);
    return {
      name,
      total: c.total,
      completed: c.completed,
      inProgress: c.inProgress,
      pending: c.pending,
      overdue: c.overdue,
      pct: c.total ? Math.round((c.completed / c.total) * 100) : 0,
      isLeader: false
    };
  }).sort((a, b) => b.total - a.total);
}

export function officerStats(tasks: WBSTask[], simDateOrMs: string | number): OfficerStat[] {
  return leadOfficerStats(tasks, simDateOrMs);
}

/** Tasks that are overdue, or fall due within `windowDays`, most urgent first. */
export function attentionTasks(tasks: WBSTask[], simDateOrMs: string | number, windowDays = 14): WBSTask[] {
  const simMs = typeof simDateOrMs === 'string' ? dayMs(simDateOrMs) : simDateOrMs;
  const simDate = typeof simDateOrMs === 'string' ? simDateOrMs : `${new Date(simMs).toISOString().slice(0, 10)}`;
  const horizon = simMs + windowDays * 86400000;
  
  return tasks
    .filter(t => t.status !== 'COMPLETED' && (isTaskOverdue(t, simDate) || t.endMs <= horizon))
    .sort((a, b) => a.endMs - b.endMs);
}

/** Month-by-month deadline load across the programme window. */
export function monthlyLoad(tasks: WBSTask[], simDateOrMs: string | number) {
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
    const st = effectiveStatus(t, simDateOrMs);
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
  leadOfficers: OfficerStat[];
  supportOfficers: OfficerStat[];
  attention: WBSTask[];
  months: ReturnType<typeof monthlyLoad>;
}

export function buildSummary(tasks: WBSTask[], simulationDate: string): ProgressSummary {
  const simMs = dayMs(simulationDate);
  const counts = countStatuses(tasks, simulationDate);
  const totalSpan = dayMs(PROGRAMME_END) - dayMs(PROGRAMME_START);
  const elapsed = simMs - dayMs(PROGRAMME_START);
  const leadStats = leadOfficerStats(tasks, simulationDate);
  const supportStats = supportOfficerStats(tasks, simulationDate);

  return {
    counts,
    pct: counts.total ? Math.round((counts.completed / counts.total) * 100) : 0,
    daysToCop: daysBetween(simulationDate, COP_TARGET),
    elapsedPct: Math.max(0, Math.min(100, Math.round((elapsed / totalSpan) * 100))),
    packages: packageStats(tasks, simulationDate),
    officers: leadStats,
    leadOfficers: leadStats,
    supportOfficers: supportStats,
    attention: attentionTasks(tasks, simulationDate),
    months: monthlyLoad(tasks, simulationDate)
  };
}
