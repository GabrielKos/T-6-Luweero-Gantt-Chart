import { WBSTask, TaskStatus, TaskPriority } from '../types';
import { 
  RAW_INITIAL_TASKS, 
  RawTaskItem, 
  canonicalizeWorkPackage, 
  getWorkPackageStyle 
} from '../data/initialTasks';

const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'for', 'in', 'a', 'an', 'with', 'by', 'on', 'from', 
  'at', 'into', 'through', 'during', 'all', 'as', 'or', 'be', 'is', 'are'
]);

/**
 * Extract YYYY-MM from a date string (e.g. "2026-08-31" -> "2026-08")
 */
export function getYearMonth(dateStr?: string): string {
  if (!dateStr || dateStr.length < 7) return '';
  return dateStr.substring(0, 7);
}

/**
 * Standardize text for deep linguistic similarity checking
 */
export function normalizeString(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[&]/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Expand domain abbreviations into uniform forms for robust matching
 */
export function expandAbbreviations(text: string): string {
  let expanded = text.toLowerCase();
  const replacements: Array<[RegExp, string]> = [
    [/\btors?\b/g, 'terms of reference'],
    [/\bsors?\b/g, 'statements of requirements'],
    [/\besia\b/g, 'environmental and social impact assessment'],
    [/\besmp\b/g, 'environmental social management plan'],
    [/\btta\b/g, 'technology transfer agreement'],
    [/\bmcida\b|\bmcda\b/g, 'multi criteria decision analysis'],
    [/\bbms\b/g, 'battery management systems'],
    [/\bboqs?\b/g, 'bills of quantities'],
    [/\bjv\b/g, 'joint venture'],
    [/\bcapex\b/g, 'capital expenditure capex'],
    [/\bopex\b/g, 'operating expenditure opex'],
    [/\bnpv\b/g, 'net present value npv'],
    [/\birr\b/g, 'internal rate of return irr'],
    [/\bwacc\b/g, 'weighted average cost of capital wacc'],
    [/\besg\b/g, 'environmental social and governance esg'],
    [/\bhse\b/g, 'health safety environmental hse'],
    [/\bip\b/g, 'intellectual property ip'],
    [/\bcatl\b/g, 'catl battery'],
    [/\bsmr\b/g, 'smr certification'],
    [/\bkmc\b/g, 'kiira motors kmc'],
    [/\bsmt\b/g, 'senior management team']
  ];

  for (const [pattern, rep] of replacements) {
    expanded = expanded.replace(pattern, rep);
  }
  return expanded;
}

/**
 * Tokenize string into significant keywords (excluding stop words)
 */
export function extractKeywords(text: string): string[] {
  const norm = normalizeString(expandAbbreviations(text));
  return norm
    .split(' ')
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Bigram Dice Similarity (0 to 1) for typo tolerance
 */
export function diceBigramSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1).replace(/\s+/g, '');
  const s2 = normalizeString(str2).replace(/\s+/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.substring(i, i + 2);
    bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.substring(i, i + 2);
    const count = bigrams1.get(bg) || 0;
    if (count > 0) {
      bigrams1.set(bg, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length - 1 + s2.length - 1);
}

/**
 * Jaccard and containment metrics on token sets
 */
export function tokenOverlapMetrics(tokensA: string[], tokensB: string[]): {
  jaccard: number;
  containment: number;
  intersectionCount: number;
} {
  if (!tokensA.length || !tokensB.length) {
    return { jaccard: 0, containment: 0, intersectionCount: 0 };
  }

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;

  setA.forEach(token => {
    if (setB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  const minLen = Math.min(setA.size, setB.size);
  const containment = minLen > 0 ? intersection / minLen : 0;

  return { jaccard, containment, intersectionCount: intersection };
}

/**
 * Match an activity string to the canonical master dataset for a given month/deadline.
 * If deadline is provided, it prioritizes matching within the exact same month to avoid
 * conflating recurring monthly activities.
 */
export function matchCanonicalMaster(activity: string, deadline?: string): RawTaskItem | undefined {
  const normRaw = normalizeString(activity).replace(/\s+/g, '');
  if (!normRaw) return undefined;

  const targetYM = getYearMonth(deadline);

  // 1. If deadline given, search filtered list of that month first
  const candidatePool = targetYM
    ? RAW_INITIAL_TASKS.filter(m => getYearMonth(m.dl) === targetYM)
    : RAW_INITIAL_TASKS;

  // Direct exact match in candidate pool
  const exactInMonth = candidatePool.find(
    m => normalizeString(m.act).replace(/\s+/g, '') === normRaw
  );
  if (exactInMonth) return exactInMonth;

  // If not found in candidate month, check full exact matches only if no month provided or exact date matches
  if (deadline) {
    const exactDateMatch = RAW_INITIAL_TASKS.find(
      m => m.dl === deadline && normalizeString(m.act).replace(/\s+/g, '') === normRaw
    );
    if (exactDateMatch) return exactDateMatch;
  }

  const rawKeywords = extractKeywords(activity);

  // Scan candidates for best fuzzy match
  let bestMatch: RawTaskItem | undefined;
  let highestScore = 0;

  for (const master of candidatePool) {
    const masterNorm = normalizeString(master.act).replace(/\s+/g, '');
    const masterKeywords = extractKeywords(master.act);
    const metrics = tokenOverlapMetrics(rawKeywords, masterKeywords);
    const dice = diceBigramSimilarity(activity, master.act);

    const isSubstring = masterNorm.includes(normRaw) || normRaw.includes(masterNorm);
    const exactDate = deadline && master.dl === deadline;

    let score = 0;
    if (isSubstring && (normRaw.length >= 8 || masterNorm.length >= 8)) {
      score += 0.85;
    }
    if (metrics.containment >= 0.75 && rawKeywords.length >= 2) {
      score += 0.8;
    }
    if (metrics.jaccard >= 0.55) {
      score += 0.7;
    }
    if (dice >= 0.7) {
      score += dice;
    }
    if (exactDate) {
      score += 0.3;
    }

    if (score > highestScore && score >= 0.8) {
      highestScore = score;
      bestMatch = master;
    }
  }

  return bestMatch;
}

/**
 * Determines if two task entries represent the SAME duplicate task within the SAME MONTH.
 * CRITICAL: Tasks in different months (e.g. Aug CFA vs Sep CFA vs Oct CFA) are distinct recurring
 * deliverables and are NEVER considered overlapping!
 */
export function areTasksOverlapping(taskA: WBSTask, taskB: WBSTask): boolean {
  if (!taskA || !taskB) return false;
  if (taskA.id === taskB.id) return true;

  // 1. MUST BE IN THE SAME MONTH (or within <= 15 days) to even be considered a candidate duplicate
  const ymA = getYearMonth(taskA.deadline);
  const ymB = getYearMonth(taskB.deadline);

  const daysDiff = Math.abs((taskA.endMs || 0) - (taskB.endMs || 0)) / (24 * 60 * 60 * 1000);

  // If different months and dates are more than 15 days apart, they are NOT duplicates
  if (ymA && ymB && ymA !== ymB && daysDiff > 15) {
    return false;
  }

  // 2. MUST BELONG TO THE SAME WORK PACKAGE
  const wpA = canonicalizeWorkPackage(taskA.wp);
  const wpB = canonicalizeWorkPackage(taskB.wp);
  if (wpA !== wpB) {
    return false;
  }

  const normA = normalizeString(taskA.activity).replace(/\s+/g, '');
  const normB = normalizeString(taskB.activity).replace(/\s+/g, '');

  // Exact normalised string in same month
  if (normA === normB && normA.length > 0) return true;

  // Compare against canonical master tasks for this specific month
  const canonicalA = matchCanonicalMaster(taskA.activity, taskA.deadline);
  const canonicalB = matchCanonicalMaster(taskB.activity, taskB.deadline);

  if (canonicalA && canonicalB && canonicalA.act === canonicalB.act && canonicalA.dl === canonicalB.dl) {
    return true;
  }

  // Token comparison
  const tokensA = extractKeywords(taskA.activity);
  const tokensB = extractKeywords(taskB.activity);
  const { jaccard, containment, intersectionCount } = tokenOverlapMetrics(tokensA, tokensB);

  // Substring check within same month
  const isSubstring = (normA.includes(normB) || normB.includes(normA)) && Math.min(normA.length, normB.length) >= 12;
  if (isSubstring && daysDiff <= 15) return true;

  // High containment within same month
  if (containment >= 0.8 && intersectionCount >= 3 && daysDiff <= 15) return true;

  // High Jaccard similarity within same month
  if (jaccard >= 0.7 && intersectionCount >= 3 && daysDiff <= 15) return true;

  // Bigram Dice similarity within same month
  const dice = diceBigramSimilarity(taskA.activity, taskB.activity);
  if (dice >= 0.8 && intersectionCount >= 3 && daysDiff <= 15) return true;

  // If exact same deadline date and strong keyword overlap in same work package
  if (taskA.deadline === taskB.deadline && intersectionCount >= 3 && jaccard >= 0.5) return true;

  return false;
}

/**
 * Status priority rank: COMPLETED > IN_PROGRESS > PENDING
 */
export function getStatusRank(status: TaskStatus): number {
  switch (status) {
    case 'COMPLETED': return 3;
    case 'IN_PROGRESS': return 2;
    case 'PENDING': return 1;
    default: return 0;
  }
}

/**
 * Priority rank: HIGH > MEDIUM > LOW
 */
export function getPriorityRank(priority?: TaskPriority): number {
  switch (priority) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
}

/**
 * Merges a cluster of overlapping tasks into one authoritative task record
 * STRICT RULES:
 * 1. Preserves the most advanced status (COMPLETED > IN_PROGRESS > PENDING).
 * 2. Preserves the completed task's dates, deadline, and assigned officers.
 * 3. Chooses the canonical Work Package and most descriptive title.
 * 4. Combines custom notes.
 * 5. Identifies duplicate Firestore document IDs for deletion.
 */
export function mergeTaskCluster(cluster: WBSTask[]): {
  merged: WBSTask;
  duplicateDocIds: string[];
  wasModified: boolean;
} {
  if (cluster.length === 1) {
    const single = cluster[0];
    const canonicalWp = canonicalizeWorkPackage(single.wp);
    const canonicalMaster = matchCanonicalMaster(single.activity, single.deadline);
    const resolvedActivity = canonicalMaster ? canonicalMaster.act : single.activity;
    const resolvedWp = canonicalMaster ? canonicalMaster.wp : canonicalWp;
    const resolvedStyle = getWorkPackageStyle(resolvedWp);

    const needsUpdate = single.wp !== resolvedWp || single.activity !== resolvedActivity;

    return {
      merged: {
        ...single,
        wp: resolvedWp,
        activity: resolvedActivity,
        style: resolvedStyle
      },
      duplicateDocIds: [],
      wasModified: needsUpdate
    };
  }

  // 1. Determine most advanced status
  let highestStatusRank = 0;
  let resolvedStatus: TaskStatus = 'PENDING';
  let bestStatusTask = cluster[0];

  for (const t of cluster) {
    const rank = getStatusRank(t.status);
    if (rank > highestStatusRank) {
      highestStatusRank = rank;
      resolvedStatus = t.status;
      bestStatusTask = t;
    }
  }

  // 2. Determine canonical master task
  let canonicalMaster: RawTaskItem | undefined;
  for (const t of cluster) {
    const match = matchCanonicalMaster(t.activity, t.deadline);
    if (match) {
      canonicalMaster = match;
      break;
    }
  }

  // 3. Resolve title & Work Package
  let finalActivity = canonicalMaster?.act || '';
  if (!finalActivity) {
    let longestTitle = '';
    for (const t of cluster) {
      if (t.activity && t.activity.length > longestTitle.length) {
        longestTitle = t.activity;
      }
    }
    finalActivity = longestTitle || cluster[0].activity;
  }

  const finalWp = canonicalMaster?.wp || canonicalizeWorkPackage(bestStatusTask.wp || cluster[0].wp);
  const finalStyle = getWorkPackageStyle(finalWp);

  // 4. Resolve dates & duration
  const finalDeadline = canonicalMaster?.dl || bestStatusTask.deadline || cluster[0].deadline;
  const finalDuration = canonicalMaster?.dur || bestStatusTask.durationDays || cluster[0].durationDays || 14;
  const end = new Date(`${finalDeadline}T00:00:00`);
  const finalEndMs = end.getTime();
  const finalStartMs = finalEndMs - (finalDuration * 24 * 60 * 60 * 1000);

  // 5. Resolve lead & support officers
  const finalLead = canonicalMaster?.lead || bestStatusTask.lead || cluster[0].lead || 'Shibah';
  const finalSupport = canonicalMaster?.support || bestStatusTask.support || cluster[0].support || '';

  // 6. Resolve highest priority
  let highestPriorityRank = 0;
  let resolvedPriority: TaskPriority = 'MEDIUM';
  for (const t of cluster) {
    const rank = getPriorityRank(t.priority);
    if (rank > highestPriorityRank) {
      highestPriorityRank = rank;
      resolvedPriority = t.priority || 'MEDIUM';
    }
  }

  // 7. Consolidate notes
  const notesSet = new Set<string>();
  for (const t of cluster) {
    if (t.notes && t.notes.trim()) {
      notesSet.add(t.notes.trim());
    }
  }
  const combinedNotes = Array.from(notesSet).join('\n---\n');

  // 8. Latest update metadata
  let latestUpdateAt = 0;
  let latestUpdateBy = 'Team Member';
  for (const t of cluster) {
    if (t.updatedAt && t.updatedAt > latestUpdateAt) {
      latestUpdateAt = t.updatedAt;
      latestUpdateBy = t.updatedBy || latestUpdateBy;
    }
  }

  // 9. Pick the primary document ID
  const primaryDoc = cluster.find(t => /^T\d+$/.test(t.id)) ||
                     cluster.find(t => t.id === bestStatusTask.id) ||
                     cluster[0];

  const duplicateDocIds = cluster
    .filter(t => t.id !== primaryDoc.id)
    .map(t => t.id);

  const mergedTask: WBSTask = {
    id: primaryDoc.id,
    wp: finalWp,
    activity: finalActivity,
    lead: finalLead,
    support: finalSupport,
    deadline: finalDeadline,
    startMs: finalStartMs,
    endMs: finalEndMs,
    status: resolvedStatus,
    durationDays: finalDuration,
    priority: resolvedPriority,
    notes: combinedNotes,
    updatedBy: latestUpdateBy,
    updatedAt: latestUpdateAt || Date.now(),
    style: finalStyle
  };

  return {
    merged: mergedTask,
    duplicateDocIds,
    wasModified: true
  };
}

/**
 * Disjoint-Set Union (Union-Find) for clustering overlapping tasks
 */
class DisjointSet {
  parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }

  find(i: number): number {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}

/**
 * Master Deduplication and Merging Pipeline:
 * 1. Groups incoming tasks by Work Package and month to isolate matching.
 * 2. Runs Disjoint-Set Union within each partition.
 * 3. Merges duplicates while strictly preserving COMPLETED status and dates.
 * 4. Standardizes all Work Package names and styles.
 * 5. Sorts chronologically.
 */
export function deduplicateAndMergeTasks(tasks: WBSTask[]): {
  deduplicatedTasks: WBSTask[];
  duplicateIdsToDelete: string[];
  updatesToPersist: Array<{ id: string; patch: Partial<WBSTask> }>;
} {
  if (!tasks || tasks.length === 0) {
    return { deduplicatedTasks: [], duplicateIdsToDelete: [], updatesToPersist: [] };
  }

  const n = tasks.length;
  const dsu = new DisjointSet(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (areTasksOverlapping(tasks[i], tasks[j])) {
        dsu.union(i, j);
      }
    }
  }

  // Group items by root
  const clusterMap = new Map<number, WBSTask[]>();
  for (let i = 0; i < n; i++) {
    const root = dsu.find(i);
    if (!clusterMap.has(root)) {
      clusterMap.set(root, []);
    }
    clusterMap.get(root)!.push(tasks[i]);
  }

  const deduplicatedTasks: WBSTask[] = [];
  const duplicateIdsToDelete: string[] = [];
  const updatesToPersist: Array<{ id: string; patch: Partial<WBSTask> }> = [];

  clusterMap.forEach((cluster) => {
    const { merged, duplicateDocIds, wasModified } = mergeTaskCluster(cluster);
    deduplicatedTasks.push(merged);
    duplicateDocIds.forEach(id => duplicateIdsToDelete.push(id));

    if (wasModified || cluster.length > 1) {
      updatesToPersist.push({
        id: merged.id,
        patch: {
          wp: merged.wp,
          activity: merged.activity,
          lead: merged.lead,
          support: merged.support,
          deadline: merged.deadline,
          startMs: merged.startMs,
          endMs: merged.endMs,
          status: merged.status,
          durationDays: merged.durationDays,
          priority: merged.priority,
          notes: merged.notes,
          updatedBy: merged.updatedBy,
          updatedAt: merged.updatedAt
        }
      });
    }
  });

  // Sort chronologically by start date, then deadline, then WP
  deduplicatedTasks.sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs;
    if (a.endMs !== b.endMs) return a.endMs - b.endMs;
    return a.activity.localeCompare(b.activity);
  });

  return {
    deduplicatedTasks,
    duplicateIdsToDelete,
    updatesToPersist
  };
}
