import React, { useState } from 'react';
import { useTimeLogs } from '../../hooks/useTimeLogs';
import { useProjects } from '../../hooks/useProjects';
import { startOfWeek, addDays, format, subWeeks, addWeeks, parseISO, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { improveText } from '../../services/aiService';
import { toast } from 'sonner';
import { Wand2 } from 'lucide-react';

export default function ClientReport({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
  const { logs } = useTimeLogs();
  const { projects } = useProjects('');
  const [currentWeekTop, setCurrentWeekTop] = useState(new Date());
  
  const wStart = startOfWeek(currentWeekTop, { weekStartsOn: 1 });
  const wEnd = addDays(wStart, 6);

  const [reports, setReports] = useState<Record<string, { done: string, next: string, fromClient: string }>>({});
  const [improving, setImproving] = useState<Record<string, boolean>>({});

  const handlePrevWeek = () => setCurrentWeekTop(subWeeks(currentWeekTop, 1));
  const handleNextWeek = () => setCurrentWeekTop(addWeeks(currentWeekTop, 1));

  const weekLogs = logs.filter(l => {
    const d = parseISO(l.date);
    return isWithinInterval(d, { start: wStart, end: wEnd }) && (l.workedMinutes || 0) > 0;
  });

  const activeProjectIds = Array.from(new Set(weekLogs.map(l => l.projectId)));
  const reportProjects = projects.filter(p => activeProjectIds.includes(p.id));

  // Initialize auto-generated done tasks
  React.useEffect(() => {
    const newReports = { ...reports };
    let changed = false;
    reportProjects.forEach(p => {
      if (!newReports[p.id]) {
        const pTasks = weekLogs
          .filter(l => l.projectId === p.id && (l.task || l.result))
          .map(l => {
            let str = l.task || 'Задача без названия';
            if (l.result) str += ` \n  ↳ Результат: ${l.result}`;
            return str;
          }).join('\n• ');
        newReports[p.id] = {
          done: pTasks ? `• ${pTasks}` : '',
          next: '',
          fromClient: ''
        };
        changed = true;
      }
    });
    if (changed) setReports(newReports);
  }, [logs, currentWeekTop]);

  const updateReport = (pId: string, field: 'done'|'next'|'fromClient', value: string) => {
    setReports(prev => ({
      ...prev,
      [pId]: { ...prev[pId], [field]: value }
    }));
  };

  const handleImprove = async (pId: string) => {
    const text = reports[pId]?.done;
    if (!text) return;

    setImproving(prev => ({ ...prev, [pId]: true }));
    try {
      const improved = await improveText(text);
      if (improved) {
        updateReport(pId, 'done', improved);
        toast.success("Текст улучшен");
      }
    } catch (e) {
      toast.error("Не удалось улучшить текст");
    } finally {
      setImproving(prev => ({ ...prev, [pId]: false }));
    }
  };

  const copyReport = (pId: string, pName: string) => {
    const r = reports[pId];
    if (!r) return;
    
    const text = `Отчет по проекту ${pName} (${format(wStart, 'dd.MM')} - ${format(wEnd, 'dd.MM')}):

Что сделано:
${r.done || '-'}

Что дальше (план на след. неделю):
${r.next || '-'}

Что нужно от клиента:
${r.fromClient || 'Нет вопросов'}`;

    navigator.clipboard.writeText(text);
    toast.success('Отчёт скопирован в буфер обмена');
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6 flex flex-col h-full font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Отчёт клиентам</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-md">
          <button onClick={handlePrevWeek} className="text-slate-500 hover:text-slate-900 px-1">←</button>
          <span className="text-sm font-medium text-slate-700">
            Неделя: [{format(wStart, 'dd.MM')} — {format(wEnd, 'dd.MM')}]
          </span>
          <button onClick={handleNextWeek} className="text-slate-500 hover:text-slate-900 px-1">→</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-4 pr-6 w-1/4">Проект</th>
                <th className="py-4 px-6 w-1/3">Что сделано (задачи и результаты)</th>
                <th className="py-4 px-6 w-1/5">Что дальше</th>
                <th className="py-4 pl-6 w-1/5">От клиента</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportProjects.map(p => (
                <tr key={p.id} className="align-top hover:bg-slate-50 transition-colors">
                  <td className="py-6 pr-6 font-medium text-slate-900">
                    <div className="mb-3">
                      <button 
                        onClick={() => onSelectProject && onSelectProject(p.id)}
                        className="hover:text-blue-600 focus:outline-none transition-colors text-left"
                        title="Перейти в карточку проекта"
                      >
                        {p.name}
                      </button>
                    </div>
                    <Button onClick={() => copyReport(p.id, p.name)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full py-2 h-auto">
                      Копировать отчёт
                    </Button>
                  </td>
                  <td className="py-6 px-6">
                    <div className="relative group">
                      <textarea
                        className="w-full text-sm p-3 border border-slate-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[120px] resize-y"
                        value={reports[p.id]?.done || ''}
                        onChange={e => updateReport(p.id, 'done', e.target.value)}
                        placeholder="Результат выполнения..."
                      />
                      <button 
                        onClick={() => handleImprove(p.id)}
                        disabled={improving[p.id]}
                        className="absolute right-2 top-2 p-1.5 bg-blue-50 text-blue-600 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                        title="Улучшить текст (AI)"
                      >
                        <Wand2 size={14} className={improving[p.id] ? "animate-pulse" : ""} />
                      </button>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <textarea
                      className="w-full text-sm p-3 border border-slate-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[120px] resize-y placeholder:text-slate-400"
                      value={reports[p.id]?.next || ''}
                      onChange={e => updateReport(p.id, 'next', e.target.value)}
                      placeholder="Планы на следующую неделю..."
                    />
                  </td>
                  <td className="py-6 pl-6">
                    <textarea
                      className="w-full text-sm p-3 border border-slate-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[120px] resize-y placeholder:text-slate-400"
                      value={reports[p.id]?.fromClient || ''}
                      onChange={e => updateReport(p.id, 'fromClient', e.target.value)}
                      placeholder="Что нужно от клиента..."
                    />
                  </td>
                </tr>
              ))}
              {reportProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">В эту неделю не было активности по проектам</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
