import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useProjects } from '../../hooks/useProjects';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatMinutes } from '../../utils/timeCalc';

export default function Settings() {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { projects, addProject, updateProject, deleteProject } = useProjects('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');

  // Project form state
  const [newProject, setNewProject] = useState({ name: '', budget: '', overhead: '1' });
  const [showArchived, setShowArchived] = useState(false);
  
  // Editing state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectData, setEditProjectData] = useState({ budget: '', overhead: '' });

  useEffect(() => {
    if (settings) {
      setHourlyRate(settings.hourlyRate || '');
      setTgToken(settings.tgToken || '');
      setTgChatId(settings.tgChatId || '');
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings({
      hourlyRate: Number(hourlyRate),
      tgToken,
      tgChatId
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const budgetNum = Number(newProject.budget) || 0;
    let multStr = String(newProject.overhead).replace(',', '.');
    const multNum = Number(multStr) || 1;
    
    await addProject({
      name: newProject.name,
      budget: budgetNum.toString(),
      overhead: multNum,
      active: true
    });
    setNewProject({ name: '', budget: '', overhead: '1' });
  };

  const handleEditClick = (project: any) => {
    setEditingProjectId(project.id);
    setEditProjectData({
      budget: project.budget || '',
      overhead: project.overhead ? project.overhead.toString() : '1'
    });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectData({ budget: '', overhead: '' });
  };

  const handleSaveEdit = async (id: string) => {
    const budgetNum = Number(editProjectData.budget) || 0;
    let multStr = String(editProjectData.overhead).replace(',', '.');
    const multNum = Number(multStr) || 1;
    
    await updateProject(id, {
      budget: budgetNum.toString(),
      overhead: multNum
    });
    
    setEditingProjectId(null);
  };

  const toggleProjectStatus = (id: string, active: boolean) => {
    updateProject(id, { active: !active });
  };

  if (settingsLoading) return <div>Загрузка настроек...</div>;

  const totalWeeklyPlanMins = projects
    .filter(p => (p as any).active !== false)
    .reduce((sum, p) => {
      const b = Number((p as any).budget) || 0;
      const h = Number(hourlyRate) || 1;
      const m = Number(String((p as any).overhead).replace(',', '.')) || 1;
      return sum + ((b / m) / h) * 60 / 4.33;
    }, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Общие настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Часовая ставка (₽)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              onBlur={handleSaveSettings}
            />
            <p className="text-xs text-slate-500 mt-2">Сохраняется автоматически</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Уведомления в Telegram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Токен бота (BotFather)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={tgToken}
                onChange={e => setTgToken(e.target.value)}
                onBlur={handleSaveSettings}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ваш Chat ID</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={tgChatId}
                onChange={e => setTgChatId(e.target.value)}
                onBlur={handleSaveSettings}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Создайте бота через @BotFather, скопируйте токен. Узнать свой Chat ID можно через бота @userinfobot.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Проекты</CardTitle>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="showArchived" 
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            <label htmlFor="showArchived" className="text-sm text-slate-600">Показывать архивные</label>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProject} className="bg-slate-50 p-4 rounded-lg flex items-end gap-3 p-4 mb-6 border border-slate-200 shadow-sm">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Название</label>
              <input 
                required
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Бюджет</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newProject.budget}
                onChange={e => setNewProject({ ...newProject, budget: e.target.value })}
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Коэфф.</label>
              <input 
                type="number" step="0.1"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newProject.overhead}
                onChange={e => setNewProject({ ...newProject, overhead: e.target.value })}
              />
            </div>
            <div className="w-32 flex flex-col justify-end">
              <span className="text-xs text-slate-500 mb-1">План в неделю:</span>
              <span className="font-medium text-sm pt-2">{formatMinutes((((Number(newProject.budget) || 0) / (Number(String(newProject.overhead).replace(',', '.')) || 1)) / (Number(hourlyRate) || 1)) * 60 / 4.33)}</span>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm bottom-0">Добавить</Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium text-right">Бюджет</th>
                  <th className="px-4 py-3 font-medium text-center">Коэфф.</th>
                  <th className="px-4 py-3 font-medium text-right">План / Нед</th>
                  <th className="px-4 py-3 font-medium text-center">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.filter((p: any) => showArchived || p.active !== false).map((project: any) => {
                  const isEditing = editingProjectId === project.id;
                  const pBudget = isEditing 
                    ? (Number(editProjectData.budget) || 0) 
                    : (Number(project.budget) || 0);
                  const pMult = isEditing 
                    ? (Number(String(editProjectData.overhead).replace(',', '.')) || 1) 
                    : (Number(String(project.overhead).replace(',', '.')) || 1);
                  const pmWeekly = ((pBudget / pMult) / (Number(hourlyRate) || 1)) * 60 / 4.33;

                  return (
                    <tr key={project.id} className={`transition-colors ${isEditing ? 'bg-blue-50/50 shadow-sm relative z-10' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-4 font-medium text-slate-900">{project.name}</td>
                      <td className="px-4 py-4 text-left">
                        {isEditing ? (
                          <input 
                            type="number"
                            className="w-full max-w-[120px] px-2 py-1 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-blue-500"
                            value={editProjectData.budget}
                            onChange={(e) => setEditProjectData({ ...editProjectData, budget: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-600">{project.budget}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-left">
                        {isEditing ? (
                          <input 
                            type="number" step="0.1"
                            className="w-full max-w-[80px] px-2 py-1 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-blue-500"
                            value={editProjectData.overhead}
                            onChange={(e) => setEditProjectData({ ...editProjectData, overhead: e.target.value })}
                          />
                        ) : (
                          <span className="text-slate-600">{project.overhead}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-left text-blue-700 font-medium">{formatMinutes(pmWeekly)}</td>
                      <td className="px-4 py-4 text-left">
                        {project.active !== false ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Активен</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Архив</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-left space-x-3 whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(project.id)} className="text-green-600 hover:text-green-800 font-medium text-xs uppercase tracking-wider">
                              Сохранить
                            </button>
                            <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-700 font-medium text-xs uppercase tracking-wider">
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(project)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                              Изменить
                            </button>
                            <button onClick={() => deleteProject(project.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">
                              Удалить
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right text-slate-700">Итого план в неделю (активные):</td>
                  <td className="px-4 py-4 text-right text-blue-700">{formatMinutes(totalWeeklyPlanMins)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
