import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  WBSTask, 
  UserProfile, 
  ActivityLog, 
  FilterState 
} from './types';
import { 
  subscribeToTasks, 
  subscribeToLogs, 
  listenToAuth, 
  updateTaskStatus, 
  saveTask, 
  deleteTask,
  restoreTask
} from './lib/firebase';
import { deduplicateAndMergeTasks } from './lib/taskMerge';
import { TIME_VIEWS, TimeViewTabs, getViewIdForDate } from './components/TimeViewTabs';
import { getEATDateString } from './lib/dateUtils';
import { isTaskOverdue } from './lib/projectStats';
import { Header, AppView } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { GanttChart } from './components/GanttChart';
import { OverallProgress } from './components/OverallProgress';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { UndoToast } from './components/UndoToast';
import { ExportPdfModal, ExportSectionChoice } from './components/ExportPdfModal';
import { CANONICAL_WORK_PACKAGES, canonicalizeWorkPackage, getWorkPackageStyle } from './data/initialTasks';
import { PLANT_BACKGROUND } from './assets/plantBackground';

export default function App() {
  const [tasks, setTasks] = useState<WBSTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Interactive Simulation Date (synced live to East Africa Time UTC+3)
  const [simulationDate, setSimulationDate] = useState(() => getEATDateString());
  const [isLiveEAT, setIsLiveEAT] = useState(true);
  
  // Landing month tab dynamically defaults to the active month with the blue indicator line
  const [currentViewId, setCurrentViewId] = useState(() => getViewIdForDate(getEATDateString()));

  // 'gantt' = the interactive workplan, 'progress' = the roll-up dashboard
  const [activeView, setActiveView] = useState<AppView>('gantt');
  // which export is running, so the buttons can show progress and stay disabled
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lastDeletedTask, setLastDeletedTask] = useState<WBSTask | null>(null);

  // Continuously sync with East Africa Time (UTC+3) World Clock
  useEffect(() => {
    const syncEATClock = () => {
      if (isLiveEAT) {
        const liveDate = getEATDateString();
        setSimulationDate(liveDate);
      }
    };

    syncEATClock();
    const interval = setInterval(syncEATClock, 30000); // 30-second interval check
    return () => clearInterval(interval);
  }, [isLiveEAT]);

  const handleSimulationDateChange = (date: string) => {
    setSimulationDate(date);
    const liveDate = getEATDateString();
    setIsLiveEAT(date === liveDate);
    // Switch to corresponding month view so the blue day line is immediately visible
    const targetMonthId = getViewIdForDate(date);
    if (targetMonthId) {
      setCurrentViewId(targetMonthId);
    }
  };

  const handleResetToLiveEAT = () => {
    const liveDate = getEATDateString();
    setSimulationDate(liveDate);
    setIsLiveEAT(true);
    setCurrentViewId(getViewIdForDate(liveDate));
  };

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    lead: 'ALL',
    support: 'ALL',
    package: 'ALL',
    status: 'ALL',
    priority: 'ALL',
    isCriticalOnly: false,
    searchQuery: '',
    layout: 'timeline'
  });

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WBSTask | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 1. Real-time Firebase Authentication
  useEffect(() => {
    const unsubscribeAuth = listenToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Tasks Subscription
  useEffect(() => {
    setSyncStatus('syncing');
    const unsubscribeTasks = subscribeToTasks(
      (updatedTasks) => {
        const { deduplicatedTasks } = deduplicateAndMergeTasks(updatedTasks);
        setTasks(deduplicatedTasks);
        setSyncStatus('synced');
      },
      (err) => {
        console.error('Firestore tasks subscription error:', err);
        setSyncStatus('offline');
      }
    );
    return () => unsubscribeTasks();
  }, []);

  // 3. Real-time Firestore Activity Logs Subscription
  useEffect(() => {
    const unsubscribeLogs = subscribeToLogs(
      (updatedLogs) => {
        setLogs(updatedLogs);
      },
      (err) => {
        console.error('Firestore logs subscription error:', err);
      }
    );
    return () => unsubscribeLogs();
  }, []);

  // Computed filter options
  const leadOfficers = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.lead) set.add(t.lead);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const supportingMembers = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.support) {
        t.support.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  const workPackages = useMemo(() => {
    return Array.from(CANONICAL_WORK_PACKAGES);
  }, []);

  // Exact overdue task count
  const overdueCount = useMemo(() => {
    const cleanList = deduplicateAndMergeTasks(tasks).deduplicatedTasks;
    return cleanList.filter(t => isTaskOverdue(t, simulationDate)).length;
  }, [tasks, simulationDate]);

  const isOverdueFilterActive = filters.status === 'OVERDUE' || filters.isCriticalOnly;

  const handleToggleOverdueFilter = useCallback(() => {
    setFilters(prev => {
      if (prev.status === 'OVERDUE' || prev.isCriticalOnly) {
        return { ...prev, status: 'ALL', isCriticalOnly: false };
      }
      return { ...prev, status: 'OVERDUE', isCriticalOnly: false };
    });
  }, []);

  const handleSelectStatusFromDashboard = useCallback((status: string) => {
    setActiveView('gantt');
    setFilters(prev => ({
      ...prev,
      status,
      isCriticalOnly: status === 'OVERDUE'
    }));
  }, []);

  // Apply filters with clean deduplication
  const filteredTasks = useMemo(() => {
    const simMs = new Date(`${simulationDate}T00:00:00`).getTime();
    const cleanList = deduplicateAndMergeTasks(tasks).deduplicatedTasks;

    return cleanList.filter((t) => {
      let matches = true;

      // Lead Officer
      if (filters.lead !== 'ALL' && t.lead !== filters.lead) matches = false;

      // Supporting Member
      if (filters.support && filters.support !== 'ALL') {
        if (!t.support || !t.support.toLowerCase().includes(filters.support.toLowerCase())) {
          matches = false;
        }
      }

      // Work Package
      if (filters.package !== 'ALL' && canonicalizeWorkPackage(t.wp) !== filters.package) matches = false;

      // Effective Status
      let effectiveStatus = t.status;
      if (effectiveStatus !== 'COMPLETED') {
        if (isTaskOverdue(t, simulationDate)) {
          effectiveStatus = 'OVERDUE';
        } else if (t.startMs <= simMs) {
          effectiveStatus = 'IN_PROGRESS';
        } else {
          effectiveStatus = 'PENDING';
        }
      }

      // Status Filter
      if (filters.status !== 'ALL' && effectiveStatus !== filters.status) matches = false;

      // Urgency / Critical Filter
      if (filters.isCriticalOnly && effectiveStatus !== 'OVERDUE') matches = false;

      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchAct = t.activity.toLowerCase().includes(query);
        const matchLead = t.lead.toLowerCase().includes(query);
        const matchSupport = t.support.toLowerCase().includes(query);
        const matchWp = t.wp.toLowerCase().includes(query);
        if (!matchAct && !matchLead && !matchSupport && !matchWp) matches = false;
      }

      return matches;
    }).sort((a, b) => {
      if (filters.layout === 'officer') {
        if (a.lead === b.lead) return a.endMs - b.endMs;
        return (a.lead || '').localeCompare(b.lead || '');
      }
      return a.endMs - b.endMs;
    });
  }, [tasks, filters, simulationDate]);

  // Current view configuration
  const currentView = useMemo(() => {
    return TIME_VIEWS.find(v => v.id === currentViewId) || TIME_VIEWS[0];
  }, [currentViewId]);

  // Authentication Protection for Edits & Adjustments
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isUserAuthenticated = () => {
    return !!(user?.displayName && user.displayName !== 'Guest Engineer' && user.displayName !== 'Team Member' && !user.isAnonymous);
  };

  const requireAuth = (action: () => void) => {
    if (isUserAuthenticated()) {
      action();
    } else {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthenticated = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    if (pendingAction) {
      const actionToExecute = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        actionToExecute();
      }, 100);
    }
  };

  // Handlers
  const handleOpenCreateTask = () => {
    requireAuth(() => {
      setEditingTask(null);
      setIsTaskModalOpen(true);
    });
  };

  const handleOpenEditTask = (task: WBSTask) => {
    requireAuth(() => {
      setEditingTask(task);
      setIsTaskModalOpen(true);
    });
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: WBSTask['status']) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const activeUserName = user?.displayName || localStorage.getItem('kmc_user_display_name') || 'Team Member';
    
    // Optimistically update React state immediately (0ms UI lag)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus, updatedAt: Date.now(), updatedBy: activeUserName } : t));

    // Asynchronously persist to Firestore
    try {
      await updateTaskStatus(taskId, nextStatus, activeUserName);
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleSaveTask = async (taskData: Partial<WBSTask>) => {
    const activeUserName = user?.displayName || localStorage.getItem('kmc_user_display_name') || 'Team Member';
    const isEdit = !!taskData.id;
    const taskId = taskData.id || `T_${Date.now()}`;
    const deadline = taskData.deadline || '2026-12-31';
    const end = new Date(`${deadline}T00:00:00`);
    const dur = taskData.durationDays || 14;
    const startMs = taskData.startMs || (end.getTime() - (dur * 24 * 60 * 60 * 1000));
    const wp = canonicalizeWorkPackage(taskData.wp || 'Business Case Development');
    const activity = (taskData.activity || 'Untitled Task').trim();

    const updatedTask: WBSTask = {
      id: taskId,
      wp,
      activity,
      lead: taskData.lead || 'Shibah',
      support: taskData.support || '',
      deadline,
      startMs,
      endMs: end.getTime(),
      status: taskData.status || 'PENDING',
      durationDays: dur,
      priority: taskData.priority || 'MEDIUM',
      notes: taskData.notes || '',
      updatedBy: activeUserName,
      updatedAt: Date.now(),
      style: getWorkPackageStyle(wp)
    };

    // Optimistically update React state immediately (0ms delay)
    setTasks(prev => {
      if (isEdit) {
        return prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t);
      } else {
        return [updatedTask, ...prev];
      }
    });

    // Asynchronously persist to Firestore
    try {
      await saveTask(taskData, activeUserName);
    } catch (err) {
      console.error('Save task Firestore error:', err);
    }
  };

  const handleDeleteTask = async (taskToDelete: WBSTask) => {
    try {
      const activeUserName = user?.displayName || localStorage.getItem('kmc_user_display_name') || 'Team Member';
      setLastDeletedTask(taskToDelete);
      // Optimistically remove from state immediately for snappy UI
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      await deleteTask(taskToDelete.id, taskToDelete.activity, activeUserName);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUndoDelete = async (taskToRestore: WBSTask) => {
    try {
      const activeUserName = user?.displayName || localStorage.getItem('kmc_user_display_name') || 'Team Member';
      // Optimistically restore to state immediately
      setTasks(prev => [taskToRestore, ...prev.filter(t => t.id !== taskToRestore.id)]);
      setLastDeletedTask(null);
      await restoreTask(taskToRestore, activeUserName);
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  const handleDismissUndo = useCallback(() => {
    setLastDeletedTask(null);
  }, []);

  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  /**
   * The set the exports work from: the interactive-control filters, narrowed
   * again to the selected period so a month tab exports that month only —
   * exactly what the Gantt shows on screen.
   */
  const exportTasks = useMemo(() => {
    if (currentView.id === 'overall') return filteredTasks;
    const startMs = new Date(`${currentView.start}T00:00:00`).getTime();
    const endMs = new Date(`${currentView.end}T23:59:59`).getTime();
    return filteredTasks.filter(t => t.startMs <= endMs && t.endMs >= startMs);
  }, [filteredTasks, currentView]);

  const filterSummary = useMemo(() => {
    const summary: string[] = [];
    if (filters.lead !== 'ALL') summary.push(`Lead: ${filters.lead}`);
    if (filters.support && filters.support !== 'ALL') summary.push(`Support: ${filters.support}`);
    if (filters.package !== 'ALL') summary.push(`Package: ${filters.package}`);
    if (filters.status !== 'ALL') summary.push(`Status: ${filters.status}`);
    if (filters.isCriticalOnly) summary.push('Overdue Only');
    if (filters.searchQuery.trim()) summary.push(`Search: "${filters.searchQuery.trim()}"`);
    return summary;
  }, [filters]);

  /** Snapshot PNG export: delegates to the renderer module. */
  const handleExportPNG = async () => {
    setIsExporting('png');
    try {
      const { exportProgressPng } = await import('./lib/exports');
      await exportProgressPng(tasks, simulationDate);
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setIsExporting(null);
    }
  };

  /** Action Matrix PDF export: delegates to the PDF renderer module. */
  const handleExportPDF = async (choices: ExportSectionChoice) => {
    setIsExporting('pdf');
    try {
      const { exportActionMatrixPdf } = await import('./lib/exports');
      await exportActionMatrixPdf({
        tasks: exportTasks,
        allTasks: tasks,
        simulationDate,
        view: currentView,
        filterSummary,
        exportSection: choices
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(null);
      setIsExportModalOpen(false);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-slate-900 font-sans select-none relative"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(2, 6, 23, 0.45) 0%, rgba(15, 23, 42, 0.35) 50%, rgba(30, 58, 138, 0.3) 100%),
          radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.22) 0%, transparent 60%),
          url("${PLANT_BACKGROUND}")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#020617'
      }}
    >
      {/* Pinned Top Navigation Bar */}
      <Header
        user={user}
        tasks={tasks}
        simulationDate={simulationDate}
        isLiveEAT={isLiveEAT}
        activeView={activeView}
        onChangeView={setActiveView}
        onSimulationDateChange={handleSimulationDateChange}
        onResetToLiveEAT={handleResetToLiveEAT}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenActivityLogs={() => setIsLogsDrawerOpen(true)}
        syncStatus={syncStatus}
        isOverdueFilterActive={isOverdueFilterActive}
        onToggleOverdueFilter={handleToggleOverdueFilter}
      />

      {activeView === 'gantt' ? (
        <>
          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={(updated) => setFilters(prev => ({ ...prev, ...updated }))}
            leadOfficers={leadOfficers}
            supportingMembers={supportingMembers}
            workPackages={workPackages}
            onAddNewTask={handleOpenCreateTask}
            onExport={() => setIsExportModalOpen(true)}
            onExportPng={handleExportPNG}
            onShareLink={handleShareLink}
            isCopied={isCopied}
            overdueCount={overdueCount}
            isExporting={isExporting}
            exportCount={exportTasks.length}
          />

          {/* Time View Tabs & Work Package Ribbon */}
          <TimeViewTabs
            currentViewId={currentViewId}
            onSelectView={setCurrentViewId}
            selectedPackage={filters.package}
            workPackages={workPackages}
            onSelectPackage={(pkg) => setFilters(prev => ({ ...prev, package: pkg }))}
          />

          {/* Main Gantt Body */}
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
            <GanttChart
              tasks={filteredTasks}
              currentView={currentView}
              simulationDate={simulationDate}
              layout={filters.layout}
              onToggleTaskStatus={handleToggleTaskStatus}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </main>
        </>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col relative">
          <OverallProgress
            tasks={tasks}
            simulationDate={simulationDate}
            onExportPng={handleExportPNG}
            onExportPdf={() => setIsExportModalOpen(true)}
            isExporting={isExporting}
            onSelectStatus={handleSelectStatusFromDashboard}
          />
        </main>
      )}

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={handleExportPDF}
        activityCount={exportTasks.length}
        currentView={currentView}
        filterSummary={filterSummary}
        isExporting={isExporting === 'pdf'}
      />

      <UndoToast
        deletedTask={lastDeletedTask}
        onUndo={handleUndoDelete}
        onDismiss={handleDismissUndo}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={user}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onAuthenticated={handleAuthenticated}
      />

      <ActivityLogDrawer
        isOpen={isLogsDrawerOpen}
        logs={logs}
        onClose={() => setIsLogsDrawerOpen(false)}
      />
    </div>
  );
}
