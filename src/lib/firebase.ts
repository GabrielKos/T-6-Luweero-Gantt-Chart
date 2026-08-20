import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  getDocs, 
  writeBatch, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  query,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { WBSTask, UserProfile, ActivityLog } from '../types';
import { generateSeedTasks, RAW_INITIAL_TASKS, RawTaskItem, WORK_PACKAGE_STYLES, DEFAULT_STYLE } from '../data/initialTasks';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if defined
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const COLLECTION_NAME = 'tasks_kmc_v1';
const LOGS_COLLECTION = 'activity_logs_kmc_v1';
const DELETED_REGISTRY_COLLECTION = 'deleted_registry_kmc_v1';

const deletedActivitiesSet = new Set<string>();

export function normalizeActivity(text: string): string {
  return (text || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Robust Canonical Task Matching
 * Strips noise, compares normalized stems, and checks if strings are prefixes/substrings of each other.
 */
export function findCanonicalMasterTask(taskActivity: string, deadline?: string): RawTaskItem | undefined {
  const norm = normalizeActivity(taskActivity);
  if (!norm) return undefined;

  // 1. Direct normalized match with master seeds
  const exact = RAW_INITIAL_TASKS.find(st => normalizeActivity(st.act) === norm);
  if (exact) return exact;

  // 2. Substring or shared root matching
  const candidates = RAW_INITIAL_TASKS.filter(st => {
    const stNorm = normalizeActivity(st.act);
    const samePrefix = norm.slice(0, 15) === stNorm.slice(0, 15);
    const substringMatch = stNorm.includes(norm) || norm.includes(stNorm);
    const dateMatch = deadline ? (st.dl === deadline) : false;

    return (samePrefix && (norm.length >= 10 || dateMatch)) || (substringMatch && (norm.length >= 12 || dateMatch));
  });

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && deadline) {
    const dateExact = candidates.find(c => c.dl === deadline);
    if (dateExact) return dateExact;
  }

  return candidates[0];
}

/**
 * Subscribe to real-time WBS tasks from Firestore.
 * STRICT POLICY:
 * 1. ONLY display what is in Firestore (do NOT invent/insert uncompleted duplicate copies).
 * 2. If Firestore contains multiple documents representing the same task (e.g. one completed shortened version and one uncompleted full version), MERGE them into ONE single canonical item, preserving completed status, notes, priority, and date.
 * 3. Permanently purge duplicate documents from Firestore in the background.
 */
export function subscribeToTasks(onUpdate: (tasks: WBSTask[]) => void, onError?: (err: Error) => void) {
  const tasksCol = collection(db, COLLECTION_NAME);

  // Pre-load deleted registry
  try {
    const deletedCol = collection(db, DELETED_REGISTRY_COLLECTION);
    getDocs(deletedCol).then((delSnap) => {
      delSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.normalizedActivity) deletedActivitiesSet.add(d.normalizedActivity);
      });
    }).catch((e) => console.warn('Could not fetch deleted registry:', e));
  } catch (e) {
    console.warn('Deleted registry listener setup failed:', e);
  }

  return onSnapshot(tasksCol, async (snapshot) => {
    if (snapshot.empty) {
      console.log('Database is empty. Seeding initial canonical WBS tasks...');
      await seedDatabase();
      return;
    }

    interface RawDocItem {
      docId: string;
      data: any;
      canonicalKey: string;
      canonicalMaster?: RawTaskItem;
    }

    const rawDocs: RawDocItem[] = [];
    const duplicatesToDelete: string[] = [];
    const updatesToPersist: Array<{ docId: string; patch: any }> = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawActivity = (data.activity || '').trim();
      const deadline = data.deadline;
      const masterMatch = findCanonicalMasterTask(rawActivity, deadline);

      // Group key is the master task's activity if matched, else normalized raw activity
      const canonicalKey = masterMatch ? normalizeActivity(masterMatch.act) : normalizeActivity(rawActivity);

      rawDocs.push({
        docId: docSnap.id,
        data,
        canonicalKey,
        canonicalMaster: masterMatch
      });
    });

    // Group documents by canonicalKey to merge and eliminate duplicates
    const groups = new Map<string, RawDocItem[]>();
    rawDocs.forEach(item => {
      if (!groups.has(item.canonicalKey)) {
        groups.set(item.canonicalKey, []);
      }
      groups.get(item.canonicalKey)!.push(item);
    });

    const finalTasks: WBSTask[] = [];
    const seenActivities = new Set<string>();

    groups.forEach((items, canonicalKey) => {
      // Check if this task was deleted by user
      if (deletedActivitiesSet.has(canonicalKey)) {
        items.forEach(it => duplicatesToDelete.push(it.docId));
        return;
      }

      // Check if ANY doc in this group was marked as COMPLETED or IN_PROGRESS by user
      const completedDoc = items.find(it => it.data.status === 'COMPLETED');
      const inProgressDoc = items.find(it => it.data.status === 'IN_PROGRESS');
      const resolvedStatus = completedDoc ? 'COMPLETED' : (inProgressDoc ? 'IN_PROGRESS' : (items[0].data.status || 'PENDING'));

      // Find any non-empty notes across the duplicate docs
      const notes = items.map(it => it.data.notes).find(n => !!n && n.trim().length > 0) || items[0].data.notes || '';

      // Pick primary document (preferring completed doc if exists, or canonical title match)
      let primary = completedDoc || items.find(it => it.canonicalMaster && it.data.activity === it.canonicalMaster.act) || items[0];

      // Find most recent updater info
      const latestItem = items.reduce((prev, curr) => (curr.data.updatedAt || 0) > (prev.data.updatedAt || 0) ? curr : prev, items[0]);
      const updatedBy = latestItem.data.updatedBy || 'Team Member';
      const updatedAt = latestItem.data.updatedAt || Date.now();

      // Canonical properties
      const master = primary.canonicalMaster;
      const finalActivity = master ? master.act : primary.data.activity;
      const finalWp = master ? master.wp : (primary.data.wp || 'Business Case Development');
      const finalLead = master ? master.lead : (primary.data.lead || 'Shibah');
      const finalSupport = master ? master.support : (primary.data.support || '');
      const finalDeadline = master ? master.dl : (primary.data.deadline || '2026-12-31');
      const finalDur = master ? master.dur : (primary.data.durationDays || 14);

      const endMs = new Date(`${finalDeadline}T00:00:00`).getTime();
      const startMs = endMs - (finalDur * 24 * 60 * 60 * 1000);

      // Clean up extra duplicate docs in background
      items.forEach(it => {
        if (it.docId !== primary.docId) {
          duplicatesToDelete.push(it.docId);
        }
      });

      // Check if primary doc in Firestore needs to be updated with canonical full title or merged status
      if (
        primary.data.activity !== finalActivity ||
        primary.data.wp !== finalWp ||
        primary.data.status !== resolvedStatus ||
        (notes && primary.data.notes !== notes)
      ) {
        updatesToPersist.push({
          docId: primary.docId,
          patch: {
            activity: finalActivity,
            wp: finalWp,
            lead: finalLead,
            support: finalSupport,
            deadline: finalDeadline,
            durationDays: finalDur,
            startMs,
            endMs,
            status: resolvedStatus,
            notes,
            updatedBy,
            updatedAt
          }
        });
      }

      finalTasks.push({
        id: primary.docId,
        wp: finalWp,
        activity: finalActivity,
        lead: finalLead,
        support: finalSupport,
        deadline: finalDeadline,
        startMs,
        endMs,
        status: resolvedStatus,
        notes,
        priority: primary.data.priority || 'MEDIUM',
        durationDays: finalDur,
        updatedBy,
        updatedAt,
        style: WORK_PACKAGE_STYLES[finalWp] || DEFAULT_STYLE
      });

      seenActivities.add(canonicalKey);
    });

    // Deliver strictly the deduplicated tasks to UI (NO synthetic duplicate injections)
    onUpdate(finalTasks);

    // Asynchronously perform background cleanup and updates in Firestore
    (async () => {
      try {
        if (duplicatesToDelete.length > 0) {
          console.log(`[Sync] Purging ${duplicatesToDelete.length} duplicate tasks from Firestore...`);
          const batch = writeBatch(db);
          duplicatesToDelete.forEach(id => {
            batch.delete(doc(db, COLLECTION_NAME, id));
          });
          await batch.commit();
        }

        if (updatesToPersist.length > 0) {
          console.log(`[Sync] Persisting ${updatesToPersist.length} canonical updates...`);
          const batch = writeBatch(db);
          updatesToPersist.forEach(u => {
            batch.update(doc(db, COLLECTION_NAME, u.docId), u.patch);
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Background sync warning:', err);
      }
    })();
  }, (err) => {
    console.error('Firestore task listener error:', err);
    if (onError) onError(err);
  });
}

/**
 * Seed initial WBS dataset
 */
export async function seedDatabase() {
  const tasksCol = collection(db, COLLECTION_NAME);
  const seedData = generateSeedTasks();
  const batch = writeBatch(db);

  seedData.forEach((t) => {
    const docRef = doc(tasksCol, t.id);
    batch.set(docRef, {
      wp: t.wp,
      activity: t.activity,
      lead: t.lead,
      support: t.support,
      deadline: t.deadline,
      startMs: t.startMs,
      endMs: t.endMs,
      status: t.status,
      durationDays: t.durationDays,
      priority: t.priority,
      notes: t.notes || '',
      updatedBy: 'System Seed',
      updatedAt: Date.now()
    });
  });

  await batch.commit();
}

/**
 * Toggle task status
 */
export async function updateTaskStatus(taskId: string, newStatus: WBSTask['status'], userName: string) {
  const taskRef = doc(db, COLLECTION_NAME, taskId);
  await updateDoc(taskRef, {
    status: newStatus,
    updatedBy: userName,
    updatedAt: Date.now()
  });

  await logActivity(taskId, 'Status update', `Changed status to ${newStatus}`, userName, newStatus === 'COMPLETED' ? 'COMPLETED' : 'STATUS_CHANGED');
}

/**
 * Save / update full task
 */
export async function saveTask(task: Partial<WBSTask> & { id?: string }, userName: string) {
  const tasksCol = collection(db, COLLECTION_NAME);
  const isEdit = !!task.id;
  const taskId = task.id || `T_${Date.now()}`;

  const end = new Date(`${task.deadline}T00:00:00`);
  const dur = task.durationDays || 14;
  const startMs = task.startMs || (end.getTime() - (dur * 24 * 60 * 60 * 1000));

  const taskData = {
    wp: task.wp || 'Business Case Development',
    activity: task.activity || 'Untitled Task',
    lead: task.lead || 'Shibah',
    support: task.support || '',
    deadline: task.deadline || '2026-12-31',
    startMs,
    endMs: end.getTime(),
    status: task.status || 'PENDING',
    durationDays: dur,
    priority: task.priority || 'MEDIUM',
    notes: task.notes || '',
    updatedBy: userName,
    updatedAt: Date.now()
  };

  const taskRef = doc(tasksCol, taskId);
  await setDoc(taskRef, taskData, { merge: true });

  await logActivity(taskId, taskData.activity, isEdit ? 'Updated task details' : 'Created new WBS task', userName, isEdit ? 'UPDATED' : 'CREATED');
}

/**
 * Delete task (and permanently add to deleted registry so it stays deleted)
 */
export async function deleteTask(taskId: string, taskTitle: string, userName: string) {
  const masterMatch = findCanonicalMasterTask(taskTitle);
  const norm = masterMatch ? normalizeActivity(masterMatch.act) : normalizeActivity(taskTitle);

  if (norm) {
    deletedActivitiesSet.add(norm);
    try {
      const cleanDocId = norm.slice(0, 120);
      const delRef = doc(db, DELETED_REGISTRY_COLLECTION, cleanDocId);
      await setDoc(delRef, {
        normalizedActivity: norm,
        originalTitle: taskTitle,
        deletedAt: Date.now(),
        deletedBy: userName
      });
    } catch (e) {
      console.warn('Could not record to deleted registry:', e);
    }
  }

  // Delete matching tasks from collection
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await deleteDoc(taskRef);
  } catch (e) {
    console.warn('Direct deleteDoc error:', e);
  }

  await logActivity(taskId, taskTitle, 'Deleted task from WBS', userName, 'DELETED');
}

/**
 * Restore previously deleted task
 */
export async function restoreTask(task: WBSTask, userName: string) {
  const masterMatch = findCanonicalMasterTask(task.activity, task.deadline);
  const norm = masterMatch ? normalizeActivity(masterMatch.act) : normalizeActivity(task.activity);

  if (norm) {
    deletedActivitiesSet.delete(norm);
    try {
      const cleanDocId = norm.slice(0, 120);
      const delRef = doc(db, DELETED_REGISTRY_COLLECTION, cleanDocId);
      await deleteDoc(delRef);
    } catch (e) {
      console.warn('Could not remove from deleted registry:', e);
    }
  }

  const tasksCol = collection(db, COLLECTION_NAME);
  const taskRef = doc(tasksCol, task.id);
  await setDoc(taskRef, {
    wp: task.wp || 'Business Case Development',
    activity: task.activity,
    lead: task.lead || 'Unassigned',
    support: task.support || '',
    deadline: task.deadline,
    startMs: task.startMs,
    endMs: task.endMs,
    status: task.status,
    durationDays: task.durationDays || 14,
    priority: task.priority || 'MEDIUM',
    notes: task.notes || '',
    updatedBy: userName,
    updatedAt: Date.now()
  });

  await logActivity(task.id, task.activity, 'Restored task to WBS', userName, 'UPDATED');
}

/**
 * Subscribe to real-time activity logs
 */
export function subscribeToLogs(onUpdate: (logs: ActivityLog[]) => void) {
  const logsCol = collection(db, LOGS_COLLECTION);
  const q = query(logsCol, orderBy('timestamp', 'desc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const logs: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      logs.push({
        id: docSnap.id,
        taskId: data.taskId || '',
        taskTitle: data.taskActivity || data.taskTitle || '',
        action: data.type || data.action || 'UPDATED',
        user: data.userName || data.user || 'Team Member',
        timestamp: data.timestamp || Date.now(),
        details: data.details || data.action || ''
      });
    });
    onUpdate(logs);
  }, (err) => {
    console.warn('Audit logs listener warning:', err);
  });
}

/**
 * Log activity helper
 */
export async function logActivity(
  taskId: string, 
  taskTitle: string, 
  details: string, 
  userName: string, 
  action: ActivityLog['action'] = 'UPDATED'
) {
  try {
    const logsCol = collection(db, LOGS_COLLECTION);
    await addDoc(logsCol, {
      taskId,
      taskTitle,
      taskActivity: taskTitle,
      action,
      type: action,
      user: userName,
      userName,
      details,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('Could not write audit log:', err);
  }
}

/**
 * Auth state listener
 */
export function listenToAuth(onUserChanged: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const storedRole = localStorage.getItem('kmc_user_role') || 'Team Member';
      const storedName = localStorage.getItem('kmc_user_display_name') || user.displayName || user.email?.split('@')[0] || 'Team Member';
      onUserChanged({
        uid: user.uid,
        displayName: storedName,
        email: user.email || '',
        role: storedRole,
        photoURL: user.photoURL || undefined,
        isAnonymous: user.isAnonymous
      });
    } else {
      const storedName = localStorage.getItem('kmc_user_display_name');
      const storedRole = localStorage.getItem('kmc_user_role');
      if (storedName) {
        onUserChanged({
          uid: 'local_member',
          displayName: storedName,
          email: `${storedName.toLowerCase().replace(/\s+/g, '')}@kiiramotors.com`,
          role: storedRole || 'Team Member',
          isAnonymous: false
        });
      } else {
        onUserChanged(null);
      }
    }
  });
}

/**
 * Set quick team profile
 */
export async function setQuickTeamProfile(displayName: string, role: string): Promise<UserProfile> {
  localStorage.setItem('kmc_user_display_name', displayName);
  localStorage.setItem('kmc_user_role', role);

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName });
    } catch (e) {
      console.warn('Could not update Firebase profile name:', e);
    }
  }

  return {
    uid: auth.currentUser?.uid || 'authenticated_member',
    displayName,
    email: auth.currentUser?.email || `${displayName.toLowerCase().replace(/\s+/g, '')}@kiiramotors.com`,
    role,
    isAnonymous: false
  };
}

/**
 * Sign in anonymously
 */
export async function loginAnonymously(displayName?: string): Promise<UserProfile> {
  const cred = await signInAnonymously(auth);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return {
    uid: cred.user.uid,
    displayName: displayName || cred.user.displayName || 'Guest User',
    email: cred.user.email || '',
    role: 'Team Member',
    isAnonymous: true
  };
}

/**
 * Sign in with Email / Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
    email: cred.user.email || '',
    role: 'Team Member',
    isAnonymous: false
  };
}

/**
 * Sign up with Email / Password
 */
export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return {
    uid: cred.user.uid,
    displayName,
    email: cred.user.email || '',
    role: 'Team Member',
    isAnonymous: false
  };
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
    email: cred.user.email || '',
    role: 'Team Member',
    photoURL: cred.user.photoURL || undefined,
    isAnonymous: false
  };
}

/**
 * Logout
 */
export async function logoutUser() {
  localStorage.removeItem('kmc_user_display_name');
  localStorage.removeItem('kmc_user_role');
  await signOut(auth);
}
