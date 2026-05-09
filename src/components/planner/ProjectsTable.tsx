import React, { useMemo, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTimeLogs } from '../../hooks/useTimeLogs';
import { useSettings } from '../../hooks/useSettings';
import { formatMinutes } from '../../utils/timeCalc';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Badge } from '../ui/Badge';

export default function ProjectsTable({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
  const { projects } = useProjects('');
  const { logs } = useTimeLogs();
  const { settings } = useSettings();
  const [showArchived, setShowArchived] = useState(false);

  const now = new Date();
  const wStart = startOfWeek(now, { weekStartsOn: 1 });
  const wEnd = endOfWeek(now, { weekStartsOn: 1 });
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const stats = useMemo(() => {
    return projects.filter((p: any) => showArchived ? true : p.active !== false).map((p: any) => {
      const budget = Number(p.budget) || 0;
      const hourlyRate = Number(settings?.hourlyRate) || 1;
      const mult = Number(p.overhead) || 1;
      
      const planWeekMins = (budget / hourlyRate) * 60 * mult;
      const planMonthMins = (budget / hourlyRate) * 60 * 4.33; // Approx weeks per month

      const pLogs = logs.filter(l => l.projectId === p.id);
      
      const factWeekMins = pLogs.filter(l => {
        const d = parseISO(l.date);
        return isWithinInterval(d, { start: wStart, end: wEnd });
      }).reduce((sum, l) => sum + (l.workedMinutes || 0), 0);

      const factMonthMins = pLogs.filter(l => {
        const d = parseISO(l.date);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      }).reduce((sum, l) => sum + (l.workedMinutes || 0), 0);

      return {
        ...p,
        planWeekMins,
        factWeekMins,
        remWeekMins: planWeekMins - factWeekMins,
        planMonthMins,
        factMonthMins,
        remMonthMins: planMonthMins - factMonthMins,
      };
    });
  }, [projects, logs, settings, wStart, wEnd, mStart, mEnd]);

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Проекты (План / Факт)</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Показывать архивные
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap font-sans">
          <thead className="text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="py-4 pr-6">Проект</th>
              <th className="py-4 px-6">Бюджет</th>
              <th className="py-4 px-6">План/Нед</th>
              <th className="py-4 px-6">Факт/Нед</th>
              <th className="py-4 px-6">Остаток/Нед</th>
              <th className="py-4 px-6">Факт/Мес</th>
              <th className="py-4 px-6">План/Мес</th>
              <th className="py-4 pl-6">Остаток/Мес</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 pr-6 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onSelectProject && onSelectProject(s.id)}
                      className="hover:text-blue-600 focus:outline-none transition-colors text-left"
                      title="Перейти в карточку проекта"
                    >
                      {s.name}
                    </button>
                    {s.active === false && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 opacity-70">
                        Архив
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-600">{s.budget}</td>
                <td className="py-4 px-6 text-slate-600">{formatMinutes(s.planWeekMins)}</td>
                
                {/* Progress bar cell for Weekly Fact */}
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1 w-24">
                    <span className={`font-medium ${s.factWeekMins > s.planWeekMins ? 'text-red-500' : 'text-slate-800'}`}>
                      {formatMinutes(s.factWeekMins)}
                    </span>
                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full ${s.factWeekMins > s.planWeekMins ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min((s.factWeekMins / (s.planWeekMins || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6">
                  <span className={`px-2 py-1 ${s.remWeekMins < 0 ? 'bg-red-50 text-red-600 font-semibold border border-red-100' : 'bg-green-50 text-green-700 font-semibold border border-green-100'}`}>
                    {formatMinutes(Math.abs(s.remWeekMins))} {s.remWeekMins < 0 && 'перерасход'}
                  </span>
                </td>

                <td className="py-4 px-6 font-medium text-slate-800">{formatMinutes(s.factMonthMins)}</td>
                <td className="py-4 px-6 text-slate-600">{formatMinutes(s.planMonthMins)}</td>
                
                <td className="py-4 pl-6">
                  <span className="text-green-700 font-semibold bg-green-50 px-2 py-1 border border-green-100">
                    {formatMinutes(Math.max(s.remMonthMins, 0))}
                  </span>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">Нет проектов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
