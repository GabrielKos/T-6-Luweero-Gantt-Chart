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
const DELETED_COLLECTION_NAME = 'deleted_tasks_kmc_v1';
const LOGS_COLLECTION = 'activity_logs_kmc_v1';

// In-memory sets of tombstoned task IDs and normalized titles to prevent resurrection
const deletedTaskIdsCache = new Set<string>();
const deletedTaskTitlesCache = new Set<string>();

/**
 * Subscribe to real-time WBS tasks from Firestore.
 * Listens to active tasks and filters out any tombstoned / deleted tasks.
 * NEVER re-inserts deleted tasks or overrides user deletions.
 */
export function subscribeToTasks(onUpdate: (tasks: WBSTask[]) => void, onError?: (err: Error) => void) {
  const tasksCol = collection(db, COLLECTION_NAME);
  const deletedCol = collection(db, DELETED_COLLECTION_NAME);

  let latestTasksSnapshot: any = null;

  const processAndEmit = () => {
    if (!latestTasksSnapshot) return;

    if (latestTasksSnapshot.empty) {
      if (deletedTaskIdsCache.size === 0) {
        // Only brand-new uninitialized empty database
        const initialSeeds = generateSeedTasks();
        onUpdate(initialSeeds);
        seedDatabase().catch(err => console.warn('Seed error:', err));
      } else {
        onUpdate([]);
      }
      return;
    }

    const rawTaskList: WBSTask[] = [];
    const docsToPurge: string[] = [];

    latestTasksSnapshot.forEach((docSnap: any) => {
      const id = docSnap.id;
      const data = docSnap.data();
      const rawActivity = (data.activity || '').trim();
      const normActivity = normalizeString(rawActivity);

      // Check if this task was explicitly deleted
      if (deletedTaskIdsCache.has(id) || (normActivity && deletedTaskTitlesCache.has(normActivity))) {
        docsToPurge.push(id);
        return;
      }

      const deadline = data.deadline || '2026-12-31';
      const dur = data.durationDays || 14;
      const endMs = data.endMs || new Date(`${deadline}T00:00:00`).getTime();
      const startMs = data.startMs || (endMs - (dur * 24 * 60 * 60 * 1000));
      const wp = canonicalizeWorkPackage(data.wp || 'Business Case Development');

      let subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
      if (subtasks.length === 0 && normActivity.includes('corporate formation') && normActivity.includes('corporate architecture')) {
        subtasks = [
          {
            id: `st_${id}_1`,
            title: 'Market Survey of Consultants',
            assignees: 'Gabriel and Druscillar',
            completed: true,
            createdAt: Date.now() - 86400000 * 5
          },
          {
            id: `st_${id}_2`,
            title: 'Evaluating the consultants',
            assignees: 'Shibah and Owen',
            completed: false,
            createdAt: Date.now() - 86400000 * 3
          },
          {
            id: `st_${id}_3`,
            title: 'Consolidate Architecture Framework & Governance Proposal',
            assignees: 'Morgan and Elizabeth',
            completed: false,
            createdAt: Date.now() - 86400000 * 1
          }
        ];
        // Persist to doc so it's saved in Firestore
        updateDoc(doc(db, COLLECTION_NAME, id), { subtasks }).catch(() => {});
      }

      let taskStatus = data.status || 'PENDING';
      if (subtasks.length > 0) {
        const allCompleted = subtasks.every((st: any) => st.completed);
        if (allCompleted) {
          taskStatus = 'COMPLETED';
        }
      }

      rawTaskList.push({
        id,
        wp,
        activity: rawActivity,
        lead: data.lead || 'Shibah',
        support: data.support || '',
        deadline,
        startMs,
        endMs,
        status: taskStatus,
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        durationDays: dur,
        updatedBy: data.updatedBy || 'Team Member',
        updatedAt: data.updatedAt || Date.now(),
        style: getWorkPackageStyle(wp),
        subtasks
      });
    });

    // Clean up any lingering resurrected docs from the database in the background
    if (docsToPurge.length > 0) {
      docsToPurge.forEach((docId) => {
        deleteDoc(doc(db, COLLECTION_NAME, docId)).catch(() => {});
      });
    }

    const { deduplicatedTasks } = deduplicateAndMergeTasks(rawTaskList);
    onUpdate(deduplicatedTasks);
  };

  // Subscribe to tombstones collection to keep deleted set up to date in real time
  const unsubDeleted = onSnapshot(deletedCol, (snapshot) => {
    deletedTaskIdsCache.clear();
    deletedTaskTitlesCache.clear();
    snapshot.forEach((d) => {
      const data = d.data();
      deletedTaskIdsCache.add(d.id);
      if (data.taskId) deletedTaskIdsCache.add(data.taskId);
      if (data.taskTitle) deletedTaskTitlesCache.add(normalizeString(data.taskTitle));
    });
    processAndEmit();
  }, (err) => {
    console.warn('Deleted tasks subscription warning:', err);
    processAndEmit();
  });

  // Subscribe to active tasks collection
  const unsubTasks = onSnapshot(tasksCol, (snapshot) => {
    latestTasksSnapshot = snapshot;
    processAndEmit();
  }, (err) => {
    console.error('Firestore task listener error:', err);
    if (onError) onError(err);
  });

  return () => {
    unsubDeleted();
    unsubTasks();
  };
}

/**
 * Seed initial canonical WBS dataset (only on fresh, uninitialized database)
 */
export async function seedDatabase() {
  const tasksCol = collection(db, COLLECTION_NAME);
  const seedData = generateSeedTasks();
  
  const CHUNK_SIZE = 200;
  for (let i = 0; i < seedData.length; i += CHUNK_SIZE) {
    const chunk = seedData.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((t) => {
      if (deletedTaskIdsCache.has(t.id) || (t.activity && deletedTaskTitlesCache.has(normalizeString(t.activity)))) {
        return;
      }
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
        subtasks: t.subtasks || [],
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
export async function updateTaskStatus(taskId: string, newStatus: WBSTask['status'], userName: string, existingTask?: WBSTask) {
  try {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    const updatePayload: any = {
      status: newStatus,
      updatedBy: userName,
      updatedAt: Date.now()
    };

    // If task has subtasks, keep subtasks aligned with main task status toggle
    if (existingTask && existingTask.subtasks && existingTask.subtasks.length > 0) {
      const isComplete = newStatus === 'COMPLETED';
      updatePayload.subtasks = existingTask.subtasks.map(st => ({
        ...st,
        completed: isComplete
      }));
    }

    await updateDoc(taskRef, updatePayload);
  } catch (e) {
    console.warn('updateTaskStatus error:', e);
  }

  // Non-blocking activity log
  logActivity(taskId, existingTask?.activity || 'Status update', `Changed status to ${newStatus}`, userName, newStatus === 'COMPLETED' ? 'COMPLETED' : 'STATUS_CHANGED').catch(() => {});
}

/**
 * Toggle a single subtask's completion status within a task
 */
export async function toggleSubtask(task: WBSTask, subtaskId: string, userName: string) {
  if (!task.subtasks) return;
  const updatedSubtasks = task.subtasks.map(st => {
    if (st.id === subtaskId) {
      return { ...st, completed: !st.completed };
    }
    return st;
  });

  const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
  const anyCompleted = updatedSubtasks.some(st => st.completed);
  let newStatus: WBSTask['status'] = task.status;
  if (allCompleted) {
    newStatus = 'COMPLETED';
  } else if (anyCompleted || task.status === 'COMPLETED') {
    newStatus = 'IN_PROGRESS';
  }

  const toggledSubtask = updatedSubtasks.find(s => s.id === subtaskId);
  const actionText = toggledSubtask?.completed ? 'Completed' : 'Reopened';
  const completedCount = updatedSubtasks.filter(s => s.completed).length;
  const pct = Math.round((completedCount / updatedSubtasks.length) * 100);

  try {
    const taskRef = doc(db, COLLECTION_NAME, task.id);
    await updateDoc(taskRef, {
      subtasks: updatedSubtasks,
      status: newStatus,
      updatedBy: userName,
      updatedAt: Date.now()
    });

    logActivity(
      task.id, 
      task.activity, 
      `${actionText} subtask "${toggledSubtask?.title}" (${completedCount}/${updatedSubtasks.length} - ${pct}%)`, 
      userName, 
      'UPDATED'
    ).catch(() => {});
  } catch (err) {
    console.warn('toggleSubtask error:', err);
  }
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
  const subtasks = task.subtasks || [];

  // Determine effective status based on subtasks
  let status = task.status || 'PENDING';
  if (subtasks.length > 0) {
    const allCompleted = subtasks.every(st => st.completed);
    if (allCompleted) {
      status = 'COMPLETED';
    } else if (status === 'COMPLETED') {
      status = 'IN_PROGRESS';
    }
  }

  const taskData: any = {
    wp: finalWp,
    activity: finalActivity,
    lead: task.lead || 'Shibah',
    support: task.support || '',
    deadline,
    startMs,
    endMs: end.getTime(),
    status,
    durationDays: dur,
    priority: task.priority || 'MEDIUM',
    notes: task.notes || '',
    subtasks,
    updatedBy: userName,
    updatedAt: Date.now()
  };

  const taskRef = doc(tasksCol, taskId);
  await setDoc(taskRef, taskData, { merge: true });

  // Non-blocking activity log
  logActivity(taskId, taskData.activity, isEdit ? 'Updated task details' : 'Created new WBS task', userName, isEdit ? 'UPDATED' : 'CREATED').catch(() => {});
}

/**
 * Delete task from Firestore with durable tombstoning so it never resurrects
 */
export async function deleteTask(
  taskId: string, 
  taskTitle: string, 
  userName: string,
  associatedDocIds?: string[]
) {
  // 1. Immediately update in-memory caches to prevent any UI flicker
  deletedTaskIdsCache.add(taskId);
  if (taskTitle) {
    deletedTaskTitlesCache.add(normalizeString(taskTitle));
  }
  if (associatedDocIds && associatedDocIds.length > 0) {
    associatedDocIds.forEach(id => deletedTaskIdsCache.add(id));
  }

  try {
    // 2. Delete primary document from tasks_kmc_v1
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    await deleteDoc(taskRef);

    // Delete any associated duplicate document IDs as well
    if (associatedDocIds && associatedDocIds.length > 0) {
      await Promise.all(
        associatedDocIds
          .filter(id => id !== taskId)
          .map(id => deleteDoc(doc(db, COLLECTION_NAME, id)).catch(() => {}))
      );
    }

    // 3. Persist tombstone to deleted_tasks_kmc_v1
    const tombRef = doc(db, DELETED_COLLECTION_NAME, taskId);
    await setDoc(tombRef, {
      taskId,
      taskTitle,
      deletedBy: userName,
      deletedAt: Date.now()
    });

    if (associatedDocIds && associatedDocIds.length > 0) {
      for (const id of associatedDocIds) {
        if (id !== taskId) {
          await setDoc(doc(db, DELETED_COLLECTION_NAME, id), {
            taskId: id,
            taskTitle,
            deletedBy: userName,
            deletedAt: Date.now()
          }).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('Direct deleteDoc or tombstone error:', e);
  }

  // 4. Log activity as DELETED
  logActivity(taskId, taskTitle, 'Deleted task from WBS', userName, 'DELETED').catch(() => {});
}

/**
 * Restore previously deleted task
 */
export async function restoreTask(task: WBSTask, userName: string) {
  // 1. Remove from local caches
  deletedTaskIdsCache.delete(task.id);
  if (task.activity) {
    deletedTaskTitlesCache.delete(normalizeString(task.activity));
  }
  if (task.mergedDocIds) {
    task.mergedDocIds.forEach(id => deletedTaskIdsCache.delete(id));
  }

  try {
    // 2. Remove tombstone from deleted_tasks_kmc_v1
    await deleteDoc(doc(db, DELETED_COLLECTION_NAME, task.id)).catch(() => {});
    if (task.mergedDocIds) {
      for (const id of task.mergedDocIds) {
        await deleteDoc(doc(db, DELETED_COLLECTION_NAME, id)).catch(() => {});
      }
    }

    // 3. Restore document in tasks_kmc_v1
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
      subtasks: task.subtasks || [],
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
export function subscribeToLogs(
  onUpdate: (logs: ActivityLog[]) => void, 
  onError?: (err: Error) => void
) {
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
    if (onError) onError(err);
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
