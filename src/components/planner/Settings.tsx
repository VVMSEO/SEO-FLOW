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
    const multNum = Number(newProject.overhead) || 1;
    const hourlyNum = Number(hourlyRate) || 1;
    
    // Calculate planned minutes per week: (budget / hourlyRate) * mult * 60 (simplified if mult is just a coef)
    const activePlanMinutes = (budgetNum / hourlyNum) * 60 * multNum;

    await addProject({
      name: newProject.name,
      budget: budgetNum.toString(),
      overhead: multNum,
      active: true
    });
    setNewProject({ name: '', budget: '', overhead: '1' });
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
      const m = Number((p as any).overhead) || 1;
      return sum + (b / h) * 60 * m;
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
              <span className="font-medium text-sm pt-2">{formatMinutes(((Number(newProject.budget) || 0) / (Number(hourlyRate) || 1)) * 60 * (Number(newProject.overhead) || 1))}</span>
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
                  const pBudget = Number(project.budget) || 0;
                  const pMult = Number(project.overhead) || 1;
                  const pmWeekly = (pBudget / (Number(hourlyRate) || 1)) * 60 * pMult;

                  return (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900">{project.name}</td>
                      <td className="px-4 py-4 text-right text-slate-600">{project.budget}</td>
                      <td className="px-4 py-4 text-center text-slate-600">{project.overhead}</td>
                      <td className="px-4 py-4 text-right text-slate-800 font-medium">{formatMinutes(pmWeekly)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {project.active !== false ? 'Активен' : 'Архив'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right space-x-3">
                        <button onClick={() => toggleProjectStatus(project.id, project.active !== false)} className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wider">
                          {project.active !== false ? 'В архив' : 'Извлечь'}
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="text-red-500 hover:text-red-700 font-medium text-xs uppercase tracking-wider">Удалить</button>
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
