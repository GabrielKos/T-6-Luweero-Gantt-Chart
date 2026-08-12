export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WorkPackageStyle {
  bg: string;
  border: string;
  light: string;
  text: string;
}

export interface WBSTask {
  id: string;
  wp: string; // Work Package
  activity: string; // Task/Activity title
  lead: string; // Lead Officer
  support: string; // Supporting Officers/Team
  deadline: string; // YYYY-MM-DD
  startMs: number;
  endMs: number;
  status: TaskStatus;
  notes?: string;
  priority?: TaskPriority;
  durationDays?: number;
  updatedBy?: string;
  updatedAt?: number;
  style?: WorkPackageStyle;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  action: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'DELETED' | 'STATUS_CHANGED';
  user: string;
  timestamp: number;
  details?: string;
}

export interface ViewOption {
  id: string;
  name: string;
  start: string;
  end: string;
  type: 'months' | 'days';
}

export interface FilterState {
  lead: string;
  support: string;
  package: string;
  status: string;
  priority: string;
  isCriticalOnly: boolean;
  searchQuery: string;
  layout: 'timeline' | 'officer';
}
