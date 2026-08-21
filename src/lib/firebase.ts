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
import { 
  generateSeedTasks, 
  canonicalizeWorkPackage, 
  getWorkPackageStyle
} from '../data/initialTasks';
import { 
  deduplicateAndMergeTasks, 
  matchCanonicalMaster, 
  normalizeString,
  getYearMonth,
  areTasksOverlapping
} from './taskMerge';
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

let hasRunInitialSync = false;

/**
 * One-time background sync that ensures Firestore has all 161 canonical deliverables
 * and eliminates duplicate docs without looping.
 */
async function syncCanonicalTasksToFirestore(existingTasks: WBSTask[]) {
  if (hasRunInitialSync) return;
  hasRunInitialSync = true;

  try {
    const canonicalSeedList = generateSeedTasks();
    const missingTasks: WBSTask[] = [];

    for (const seed of canonicalSeedList) {
      const seedMonth = getYearMonth(seed.deadline);
      const seedNorm = normalizeString(seed.activity);

      const exists = existingTasks.some((rt) => {
        const rtMonth = getYearMonth(rt.deadline);
        if (rtMonth !== seedMonth) return false;
        return normalizeString(rt.activity) === seedNorm || areTasksOverlapping(rt, seed);
      });

      if (!exists) {
        missingTasks.push(seed);
      }
    }

    if (missingTasks.length > 0) {
      console.log(`[Reconciliation Engine] Writing ${missingTasks.length} missing canonical tasks to Firestore in background...`);
      const CHUNK_SIZE = 200;
      for (let i = 0; i < missingTasks.length; i += CHUNK_SIZE) {
        const chunk = missingTasks.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((t) => {
          const docRef = doc(db, COLLECTION_NAME, t.id);
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
            updatedBy: 'Canonical Sync',
            updatedAt: Date.now()
          }, { merge: true });
        });
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('[Sync Warning] Background sync error:', err);
  }
}

/**
 * Subscribe to real-time WBS tasks from Firestore.
 * Pure snapshot mapping with in-memory canonical hydration for instant, lag-free UI rendering.
 */
export function subscribeToTasks(onUpdate: (tasks: WBSTask[]) => void, onError?: (err: Error) => void) {
  const tasksCol = collection(db, COLLECTION_NAME);

  return onSnapshot(tasksCol, (snapshot) => {
    if (snapshot.empty) {
      const initialSeeds = generateSeedTasks();
      onUpdate(initialSeeds);
      seedDatabase().catch(err => console.warn('Seed error:', err));
      return;
    }

    const rawTaskList: WBSTask[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawActivity = (data.activity || '').trim();
      const deadline = data.deadline || '2026-12-31';
      const dur = data.durationDays || 14;
      const endMs = data.endMs || new Date(`${deadline}T00:00:00`).getTime();
      const startMs = data.startMs || (endMs - (dur * 24 * 60 * 60 * 1000));
      const wp = canonicalizeWorkPackage(data.wp || 'Business Case Development');

      rawTaskList.push({
        id: docSnap.id,
        wp,
        activity: rawActivity,
        lead: data.lead || 'Shibah',
        support: data.support || '',
        deadline,
        startMs,
        endMs,
        status: data.status || 'PENDING',
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        durationDays: dur,
        updatedBy: data.updatedBy || 'Team Member',
        updatedAt: data.updatedAt || Date.now(),
        style: getWorkPackageStyle(wp)
      });
    });

    // In-memory canonical guarantee: check if any master tasks are missing and blend them in memory
    const canonicalSeedList = generateSeedTasks();
    const missingInMem: WBSTask[] = [];

    for (const seed of canonicalSeedList) {
      const exists = rawTaskList.some((rt) => {
        if (rt.id === seed.id) return true;
        // Check if matching duplicate task within the same month and same work package
        return areTasksOverlapping(rt, seed);
      });

      if (!exists) {
        missingInMem.push(seed);
      }
    }

    const combinedList = [...rawTaskList, ...missingInMem];
    const { deduplicatedTasks } = deduplicateAndMergeTasks(combinedList);

    // Push instantly to UI without latency
    onUpdate(deduplicatedTasks);

    // Trigger one-time background sync if not already done
    if (!hasRunInitialSync) {
      syncCanonicalTasksToFirestore(rawTaskList);
    }
  }, (err) => {
    console.error('Firestore task listener error:', err);
    if (onError) onError(err);
  });
}

/**
 * Seed initial canonical WBS dataset (all 161 tasks)
 */
export async function seedDatabase() {
  const tasksCol = collection(db, COLLECTION_NAME);
  const seedData = generateSeedTasks();
  
  const CHUNK_SIZE = 200;
  for (let i = 0; i < seedData.length; i += CHUNK_SIZE) {
    const chunk = seedData.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((t) => {
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
}

/**
 * Toggle task status
 */
export async function updateTaskStatus(taskId: string, newStatus: WBSTask['status'], userName: string) {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      updatedBy: userName,
      updatedAt: Date.now()
    });
  } catch (e) {
    console.warn('updateTaskStatus error:', e);
  }

  // Non-blocking activity log
  logActivity(taskId, 'Status update', `Changed status to ${newStatus}`, userName, newStatus === 'COMPLETED' ? 'COMPLETED' : 'STATUS_CHANGED').catch(() => {});
}

/**
 * Save / update full task
 */
export async function saveTask(task: Partial<WBSTask> & { id?: string }, userName: string) {
  const tasksCol = collection(db, COLLECTION_NAME);
  const isEdit = !!task.id;
  const taskId = task.id || `T_${Date.now()}`;

  const deadline = task.deadline || '2026-12-31';
  const end = new Date(`${deadline}T00:00:00`);
  const dur = task.durationDays || 14;
  const startMs = task.startMs || (end.getTime() - (dur * 24 * 60 * 60 * 1000));
  const finalWp = canonicalizeWorkPackage(task.wp || 'Business Case Development');
  const finalActivity = (task.activity || 'Untitled Task').trim();

  const taskData = {
    wp: finalWp,
    activity: finalActivity,
    lead: task.lead || 'Shibah',
    support: task.support || '',
    deadline,
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

  // Non-blocking activity log
  logActivity(taskId, taskData.activity, isEdit ? 'Updated task details' : 'Created new WBS task', userName, isEdit ? 'UPDATED' : 'CREATED').catch(() => {});
}

/**
 * Delete task from Firestore
 */
export async function deleteTask(taskId: string, taskTitle: string, userName: string) {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await deleteDoc(taskRef);
  } catch (e) {
    console.warn('Direct deleteDoc error:', e);
  }

  logActivity(taskId, taskTitle, 'Deleted task from WBS', userName, 'DELETED').catch(() => {});
}

/**
 * Restore previously deleted task
 */
export async function restoreTask(task: WBSTask, userName: string) {
  try {
    const tasksCol = collection(db, COLLECTION_NAME);
    const taskRef = doc(tasksCol, task.id);
    const wp = canonicalizeWorkPackage(task.wp || 'Business Case Development');

    await setDoc(taskRef, {
      wp,
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
  } catch (e) {
    console.warn('restoreTask error:', e);
  }

  logActivity(task.id, task.activity, 'Restored task to WBS', userName, 'UPDATED').catch(() => {});
}

/**
 * Subscribe to real-time activity logs
 */
export function subscribeToLogs(onUpdate: (logs: ActivityLog[]) => void) {
  const logsCol = collection(db, LOGS_COLLECTION);
  const q = query(logsCol, orderBy('timestamp', 'desc'), limit(50));

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
    // Non-fatal
  }
}

/**
 * Auth state listener
 */
export function listenToAuth(onUserChange: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      onUserChange({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Team Member',
        role: 'Project Member',
        photoURL: firebaseUser.photoURL || undefined,
        isAnonymous: firebaseUser.isAnonymous
      });
    } else {
      // Auto sign in anonymously if not logged in
      signInAnonymously(auth).catch((err) => {
        console.warn('Anonymous auth note:', err);
        onUserChange({
          uid: 'guest-session',
          email: null,
          displayName: 'Guest Engineer',
          role: 'Viewer',
          isAnonymous: true
        });
      });
    }
  });
}

export async function setQuickTeamProfile(name: string, role: string): Promise<void> {
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: name });
    } catch (e) {
      console.warn('Profile update note:', e);
    }
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || 'Team Member',
    role: 'Project Member',
    photoURL: cred.user.photoURL || undefined,
    isAnonymous: false
  };
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || email.split('@')[0],
    role: 'Project Member',
    isAnonymous: false
  };
}

export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName: name });
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: name,
    role: 'Project Member',
    isAnonymous: false
  };
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
