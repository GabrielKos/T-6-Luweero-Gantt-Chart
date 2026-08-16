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
import { generateSeedTasks, WORK_PACKAGE_STYLES, DEFAULT_STYLE } from '../data/initialTasks';
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

/**
 * Subscribe to real-time WBS tasks from Firestore
 */
export function subscribeToTasks(onUpdate: (tasks: WBSTask[]) => void, onError?: (err: Error) => void) {
  const tasksCol = collection(db, COLLECTION_NAME);

  return onSnapshot(tasksCol, async (snapshot) => {
    if (snapshot.empty) {
      // Seed database if empty
      console.log('Seeding initial WBS tasks...');
      await seedDatabase();
      return;
    }

    const tasks: WBSTask[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      tasks.push({
        id: docSnap.id,
        wp: data.wp || 'General',
        activity: data.activity || '',
        lead: data.lead || 'Unassigned',
        support: data.support || '',
        deadline: data.deadline || '2026-12-31',
        startMs: data.startMs || Date.now(),
        endMs: data.endMs || Date.now(),
        status: data.status || 'PENDING',
        notes: data.notes || '',
        priority: data.priority || 'MEDIUM',
        durationDays: data.durationDays || 14,
        updatedBy: data.updatedBy || 'System',
        updatedAt: data.updatedAt || Date.now(),
        style: WORK_PACKAGE_STYLES[data.wp] || DEFAULT_STYLE
      });
    });

    onUpdate(tasks);
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
 * Delete task
 */
export async function deleteTask(taskId: string, taskTitle: string, userName: string) {
  const taskRef = doc(db, COLLECTION_NAME, taskId);
  await deleteDoc(taskRef);
  await logActivity(taskId, taskTitle, 'Deleted task from WBS', userName, 'DELETED');
}

/**
 * Activity log writer
 */
export async function logActivity(
  taskId: string, 
  taskTitle: string, 
  details: string, 
  userName: string, 
  action: ActivityLog['action']
) {
  try {
    const logsCol = collection(db, LOGS_COLLECTION);
    await addDoc(logsCol, {
      taskId,
      taskTitle,
      action,
      details,
      user: userName,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

/**
 * Subscribe to activity logs
 */
export function subscribeToLogs(onUpdate: (logs: ActivityLog[]) => void) {
  const logsCol = collection(db, LOGS_COLLECTION);
  const q = query(logsCol, orderBy('timestamp', 'desc'), limit(30));

  return onSnapshot(q, (snapshot) => {
    const logs: ActivityLog[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        action: data.action,
        user: data.user,
        timestamp: data.timestamp,
        details: data.details
      });
    });
    onUpdate(logs);
  });
}

/**
 * Auth Helpers
 */
export function listenToAuth(onUserChange: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const customName = localStorage.getItem('kmc_user_display_name') || user.displayName || user.email?.split('@')[0] || 'Team Member';
      const customRole = localStorage.getItem('kmc_user_role') || 'Project Contributor';
      onUserChange({
        uid: user.uid,
        email: user.email,
        displayName: customName,
        role: customRole,
        photoURL: user.photoURL || undefined,
        isAnonymous: user.isAnonymous
      });
    } else {
      // Attempt auto anonymous login for instant experience; if disabled/restricted on console, fallback to local team member profile
      const storedName = localStorage.getItem('kmc_user_display_name') || 'Team Member';
      const storedRole = localStorage.getItem('kmc_user_role') || 'Team';
      try {
        const cred = await signInAnonymously(auth);
        onUserChange({
          uid: cred.user.uid,
          email: null,
          displayName: storedName,
          role: storedRole,
          isAnonymous: true
        });
      } catch {
        // Anonymous auth provider is restricted in Firebase console
        onUserChange({
          uid: 'local_member',
          email: null,
          displayName: storedName,
          role: storedRole,
          isAnonymous: true
        });
      }
    }
  });
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function signupWithEmail(email: string, pass: string, displayName: string, role: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName });
  localStorage.setItem('kmc_user_display_name', displayName);
  localStorage.setItem('kmc_user_role', role);
  return cred;
}

export async function setQuickTeamProfile(name: string, role: string) {
  localStorage.setItem('kmc_user_display_name', name);
  localStorage.setItem('kmc_user_role', role);
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: name });
    } catch (e) {
      console.warn('Could not update remote profile:', e);
    }
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out notice:', err);
  }
  try {
    await signInAnonymously(auth);
  } catch {
    // Silently ignore if anonymous auth is restricted
  }
}
