import React, { useState, useEffect, useMemo } from 'react';
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
  deleteTask 
} from './lib/firebase';
import { TIME_VIEWS } from './components/TimeViewTabs';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TimeViewTabs } from './components/TimeViewTabs';
import { GanttChart } from './components/GanttChart';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';

export default function App() {
  const [tasks, setTasks] = useState<WBSTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Interactive Simulation Date (defaulting to current mock date Aug 12, 2026)
  const [simulationDate, setSimulationDate] = useState('2026-08-12');
  const [currentViewId, setCurrentViewId] = useState('overall');

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
        setTasks(updatedTasks);
        setSyncStatus('synced');
      },
      (err) => {
        console.error('Task sync error:', err);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribeTasks();
  }, []);

  // 3. Real-time Firestore Audit Logs Subscription
  useEffect(() => {
    const unsubscribeLogs = subscribeToLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribeLogs();
  }, []);

  // Extract unique Lead Officers, Supporting Members, and Work Packages for filters
  const leadOfficers = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => { if (t.lead) set.add(t.lead); });
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
    const set = new Set<string>();
    tasks.forEach(t => { if (t.wp) set.add(t.wp); });
    return Array.from(set).sort();
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    const simMs = new Date(`${simulationDate}T00:00:00`).getTime();

    return tasks.filter((t) => {
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
      if (filters.package !== 'ALL' && t.wp !== filters.package) matches = false;

      // Effective Status
      let effectiveStatus = t.status;
      if (effectiveStatus !== 'COMPLETED' && t.endMs < simMs) {
        effectiveStatus = 'OVERDUE' as any;
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

  // Task Handlers
  const handleToggleTaskStatus = async (taskId: string, currentStatus: WBSTask['status']) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const activeUserName = user?.displayName || 'Team Member';
    await updateTaskStatus(taskId, newStatus, activeUserName);
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: WBSTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<WBSTask> & { id?: string }) => {
    const activeUserName = user?.displayName || 'Team Member';
    await saveTask(taskData, activeUserName);
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    const activeUserName = user?.displayName || 'Team Member';
    await deleteTask(taskId, taskTitle, activeUserName);
  };

  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden antialiased bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <Header
        user={user}
        tasks={tasks}
        simulationDate={simulationDate}
        onSimulationDateChange={setSimulationDate}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenActivityLogs={() => setIsLogsDrawerOpen(true)}
        syncStatus={syncStatus}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={(updated) => setFilters(prev => ({ ...prev, ...updated }))}
        leadOfficers={leadOfficers}
        supportingMembers={supportingMembers}
        workPackages={workPackages}
        onAddNewTask={handleOpenCreateTask}
        onExport={handleExportPDF}
        onShareLink={handleShareLink}
        isCopied={isCopied}
      />

      {/* Time View Tabs */}
      <TimeViewTabs
        currentViewId={currentViewId}
        onSelectView={setCurrentViewId}
      />

      {/* Main Gantt Body */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white relative">
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

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={user}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ActivityLogDrawer
        isOpen={isLogsDrawerOpen}
        logs={logs}
        onClose={() => setIsLogsDrawerOpen(false)}
      />
    </div>
  );
}
