import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useSettings } from '../hooks/useSettings';
import { useTelegramReminders } from '../hooks/useTelegramReminders';
import { useTimer } from '../context/TimerContext';
import { 
  Plus, Folder, LayoutDashboard, ListTodo, List, BookOpen, CheckCircle, 
  LogOut, Download, CalendarDays, Calendar, LayoutList, Settings as SettingsIcon, 
  Tags, FileBarChart 
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { OverviewTab } from './tabs/OverviewTab';
import { CurrentWorkTab } from './tabs/CurrentWorkTab';
import { QueueTab } from './tabs/QueueTab';
import { LogTab } from './tabs/LogTab';
import { CompletedTab } from './tabs/CompletedTab';
import { DailyLogTab } from './tabs/DailyLogTab';
import { AccessesTab } from './tabs/AccessesTab';

import WeekView from './planner/WeekView';
import MonthView from './planner/MonthView';
import ProjectsTable from './planner/ProjectsTable';
import ClientReport from './planner/ClientReport';
import Categories from './planner/Categories';
import Settings from './planner/Settings';

import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { exportProjectToExcel } from '../lib/exportExcel';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'overview' | 'accesses' | 'current' | 'queue' | 'log' | 'completed' | 'dailylog';
type SectionType = 'tracker' | 'month' | 'projects_table' | 'clients' | 'categories' | 'settings' | 'project';

export function AppLayout({ user }: { user: User }) {
  const { projects, activeProject, activeProjectId, setActiveProjectId, addProject, updateProject } = useProjects(user.uid);
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { activeTimer } = useTimer();
  
  // Telegram Reminders Hook
  useTelegramReminders(user, settings, activeTimer, projects);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeSection, setActiveSection] = useState<SectionType>('tracker');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleExport = () => {
    if (activeProject) {
      exportProjectToExcel(activeProject);
    }
  };

  const selectProject = (id: string) => {
    setActiveProjectId(id);
    setActiveSection('project');
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'tracker': return <WeekView />;
      case 'month': return <MonthView onSelectProject={selectProject} />;
      case 'projects_table': return <ProjectsTable onSelectProject={selectProject} />;
      case 'clients': return <ClientReport onSelectProject={selectProject} />;
      case 'categories': return <Categories />;
      case 'settings': return <Settings />;
      case 'project': 
        if (!activeProject) return (
          <div className="flex-1 flex items-center justify-center text-zinc-500 bg-zinc-50/50">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 inline-block mb-4">
                <Folder className="w-12 h-12 text-zinc-300" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-medium text-zinc-800 mb-1">Выберите проект</h3>
              <p className="text-sm text-zinc-500">Или создайте новый в боковой панели</p>
            </motion.div>
          </div>
        );
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Top Navigation for Project */}
            <div className="bg-white border-b border-zinc-100 px-6 h-16 flex items-center justify-between shrink-0 z-10 sticky top-0">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{activeProject.name}</h2>
                <Button variant="ghost" size="sm" onClick={handleExport} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 h-8 rounded-full" title="Экспорт в Excel">
                  <Download className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Excel</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-full border border-zinc-100 overflow-x-auto hide-scrollbar">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Обзор</TabButton>
                <TabButton active={activeTab === 'accesses'} onClick={() => setActiveTab('accesses')}>Доступы</TabButton>
                <TabButton active={activeTab === 'current'} onClick={() => setActiveTab('current')}>Текущая работа</TabButton>
                <TabButton active={activeTab === 'dailylog'} onClick={() => setActiveTab('dailylog')}>Лента действий</TabButton>
                <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')}>Очередь</TabButton>
                <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Журнал</TabButton>
                <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>Завершённое</TabButton>
              </div>
            </div>

            {/* Project Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
              <div className="max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'overview' && <OverviewTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'accesses' && <AccessesTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'current' && <CurrentWorkTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'dailylog' && <DailyLogTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'queue' && <QueueTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'log' && <LogTab project={activeProject} updateProject={updateProject} />}
                    {activeTab === 'completed' && <CompletedTab project={activeProject} updateProject={updateProject} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const navItems = [
    { id: 'tracker', name: 'Трекер', icon: <CalendarDays size={18} /> },
    { id: 'month', name: 'Месяц', icon: <Calendar size={18} /> },
    { id: 'projects_table', name: 'Проекты', icon: <LayoutList size={18} /> },
    { id: 'clients', name: 'Клиенты', icon: <FileBarChart size={18} /> },
    { id: 'categories', name: 'Категории', icon: <Tags size={18} /> },
    { id: 'settings', name: 'Настройки', icon: <SettingsIcon size={18} /> }
  ];

  if (settingsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500">Загрузка данных...</div>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Sidebar */}
      <div className="w-[260px] bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="h-16 px-6 flex items-center justify-between shrink-0">
          <div className="font-bold text-lg text-zinc-900 flex items-center gap-2">
            SEO Planner
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 hide-scrollbar">
          {/* Main Navigation */}
          <nav className="space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as SectionType);
                  if (item.id !== 'project') setActiveProjectId(null);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all text-left",
                  activeSection === item.id && activeProjectId === null
                    ? "bg-zinc-900 text-white font-medium shadow-sm" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <div className={cn("shrink-0", activeSection === item.id && activeProjectId === null ? "text-white" : "text-zinc-400 group-hover:text-zinc-600")}>
                  {item.icon}
                </div>
                <span className="truncate text-sm">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Projects List */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2 group">
              <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Проекты ({projects.filter(p => p.active !== false).length})
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsAddingProject(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {isAddingProject && (
              <form onSubmit={handleAddProject} className="mb-2 px-1">
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onBlur={() => setIsAddingProject(false)}
                  placeholder="Название проекта..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
              </form>
            )}

            <nav className="space-y-0.5">
              {projects.filter(p => p.active !== false).map(project => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all text-left group",
                    activeProjectId === project.id
                      ? "bg-zinc-900 text-white font-medium shadow-sm" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <Folder className={cn("h-4 w-4 shrink-0", activeProjectId === project.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-600")} strokeWidth={2} />
                  <span className="truncate text-sm">{project.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 shrink-0 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-zinc-600">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-xs text-zinc-600 font-medium truncate pr-2" title={user.email || ''}>
                {user.email}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {renderMainContent()}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none",
        active 
          ? "text-zinc-900" 
          : "text-zinc-500 hover:text-zinc-900"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white shadow-sm rounded-full border border-zinc-200/50"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
