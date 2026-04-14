import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Plus, Folder, LayoutDashboard, ListTodo, List, BookOpen, CheckCircle, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { OverviewTab } from './tabs/OverviewTab';
import { CurrentWorkTab } from './tabs/CurrentWorkTab';
import { QueueTab } from './tabs/QueueTab';
import { LogTab } from './tabs/LogTab';
import { CompletedTab } from './tabs/CompletedTab';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

type TabType = 'overview' | 'current' | 'queue' | 'log' | 'completed';

export function AppLayout({ user }: { user: User }) {
  const { projects, activeProject, activeProjectId, setActiveProjectId, addProject, updateProject } = useProjects(user.uid);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="font-extrabold text-lg text-blue-600 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
            SEO FLOW
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsAddingProject(true)} className="text-blue-600 h-8 w-8 hover:bg-blue-50">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Проекты</div>
          {isAddingProject && (
            <form onSubmit={handleAddProject} className="mb-2">
              <input
                autoFocus
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onBlur={() => setIsAddingProject(false)}
                placeholder="Имя проекта..."
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </form>
          )}
          
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={cn(
                "w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                activeProjectId === project.id 
                  ? "bg-blue-50 font-medium text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Folder className={cn("h-4 w-4 shrink-0", activeProjectId === project.id ? "text-blue-600" : "text-slate-400")} />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
          
          {projects.length === 0 && !isAddingProject && (
            <div className="text-sm text-slate-500 text-center py-4">
              Нет проектов. Создайте первый!
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 truncate pr-2" title={user.email || ''}>
              {user.email}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeProject ? (
          <>
            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800">{activeProject.name}</h2>
              
              <div className="flex h-full">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Обзор</TabButton>
                <TabButton active={activeTab === 'current'} onClick={() => setActiveTab('current')}>Текущая работа</TabButton>
                <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')}>Очередь</TabButton>
                <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Журнал</TabButton>
                <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>Завершённое</TabButton>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto">
                {activeTab === 'overview' && <OverviewTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'current' && <CurrentWorkTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'queue' && <QueueTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'log' && <LogTab project={activeProject} updateProject={updateProject} />}
                {activeTab === 'completed' && <CompletedTab project={activeProject} updateProject={updateProject} />}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 inline-block mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mx-auto"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Выберите проект</h3>
              <p className="text-sm text-slate-500">Или создайте новый в боковой панели</p>
            </div>
          </div>
        )}
      </div>
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
