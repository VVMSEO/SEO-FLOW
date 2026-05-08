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
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 inline-block mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mx-auto"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Выберите проект</h3>
              <p className="text-sm text-slate-500">Или создайте новый в боковой панели</p>
            </div>
          </div>
        );
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation for Project */}
            <div className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-slate-800">{activeProject.name}</h2>
                <Button variant="ghost" size="sm" onClick={handleExport} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8" title="Экспорт в Excel">
                  <Download className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Excel</span>
                </Button>
              </div>
              
              <div className="flex h-full overflow-x-auto whitespace-nowrap hide-scrollbar">
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
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto">
                {activeTab === 'overview' && <OverviewTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'accesses' && <AccessesTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'current' && <CurrentWorkTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'dailylog' && <DailyLogTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'queue' && <QueueTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'log' && <LogTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'completed' && <CompletedTab project={activeProject} updateProject={updateProject} />}
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Загрузка данных...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-300">
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="font-extrabold text-lg text-white flex items-center gap-2">
            SEO Planner
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as SectionType);
                  if (item.id !== 'project') setActiveProjectId(null);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-left",
                  activeSection === item.id && activeProjectId === null
                    ? "bg-blue-600 text-white font-medium" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className={cn("shrink-0", activeSection === item.id && activeProjectId === null ? "text-white" : "text-slate-400")}>
                  {item.icon}
                </div>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Projects List */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Проекты ({projects.filter(p => p.active !== false).length})
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800 border-none"
                onClick={() => setIsAddingProject(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {isAddingProject && (
              <form onSubmit={handleAddProject} className="mb-2 px-3">
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onBlur={() => setIsAddingProject(false)}
                  placeholder="Название проекта"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </form>
            )}

            <nav className="space-y-0.5">
              {projects.filter(p => p.active !== false).map(project => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-left",
                    activeProjectId === project.id
                      ? "bg-blue-600 text-white font-medium" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Folder className={cn("h-4 w-4 shrink-0", activeProjectId === project.id ? "text-white" : "text-slate-400")} />
                  <span className="truncate text-sm">{project.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 truncate pr-2" title={user.email || ''}>
              {user.email}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 border-none" title="Выйти">
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
        "flex items-center px-4 h-full text-sm font-medium transition-all border-b-2",
        active 
          ? "text-blue-600 border-blue-600 bg-gradient-to-t from-blue-50 to-transparent" 
          : "text-slate-500 border-transparent hover:text-slate-800"
      )}
    >
      <span className="uppercase tracking-wide text-xs font-semibold">{children}</span>
    </button>
  );
}
