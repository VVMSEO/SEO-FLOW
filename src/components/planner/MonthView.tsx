import React, { useState, useMemo } from 'react';
import { useTimeLogs } from '../../hooks/useTimeLogs';
import { useProjects } from '../../hooks/useProjects';
import { formatMinutes } from '../../utils/timeCalc';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function MonthView({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
  const { logs } = useTimeLogs();
  const { projects } = useProjects('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  
  // Pad beginning of month to start on Monday
  const startDay = getDay(monthStart) === 0 ? 7 : getDay(monthStart);
  let daysArray = [];
  for (let i = 1; i < startDay; i++) {
    daysArray.push(null); // Empty slots
  }
  daysArray = [...daysArray, ...eachDayOfInterval({ start: monthStart, end: monthEnd })];

  const monthLogs = logs.filter(l => l.date.startsWith(format(monthStart, 'yyyy-MM')));

  const totalWorked = monthLogs.reduce((sum, l) => sum + (l.workedMinutes || 0), 0);
  
  const workedDaysSet = new Set(monthLogs.filter(l => (l.workedMinutes || 0) > 0).map(l => l.date));
  const workDaysCount = workedDaysSet.size;

  const avgPerDay = workDaysCount > 0 ? Math.round(totalWorked / workDaysCount) : 0;

  const projectSummary = projects.map(p => {
    const pLogs = monthLogs.filter(l => l.projectId === p.id);
    return {
      id: p.id,
      name: p.name,
      fact: pLogs.reduce((sum, l) => sum + (l.workedMinutes || 0), 0),
      plan: pLogs.reduce((sum, l) => sum + (l.minutes || 0), 0)
    };
  }).filter(p => p.fact > 0 || p.plan > 0);

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Месяц</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-zinc-200 rounded-xl shadow-sm">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-zinc-400 hover:text-zinc-900 px-1 transition-colors">←</button>
          <span className="text-sm font-medium text-zinc-700 capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-zinc-400 hover:text-zinc-900 px-1 transition-colors">→</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-zinc-200/60 shadow-sm">
        <div className="grid grid-cols-7 gap-2 mb-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">
          <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {daysArray.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-transparent rounded-2xl aspect-square"></div>;
            
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayWork = monthLogs.filter(l => l.date === dateStr).reduce((sum, l) => sum + (l.workedMinutes || 0), 0);
            
            const hasWork = dayWork > 0;

            return (
              <div 
                key={dateStr} 
                className={`rounded-2xl aspect-square p-2 flex flex-col items-center justify-center transition-all ${
                  hasWork ? 'bg-zinc-900 text-white shadow-md' : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:bg-zinc-100'
                }`}
              >
                <span className={`text-xl mb-1 ${hasWork ? 'font-bold' : 'font-medium'}`}>{format(day, 'd')}</span>
                {hasWork && (
                  <span className="text-[10px] text-zinc-300 font-bold tracking-wide whitespace-nowrap bg-white/10 px-2 py-0.5 rounded-full">
                    {formatMinutes(dayWork)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200/60 p-6 rounded-3xl text-center shadow-sm">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2">Всего часов за месяц</div>
          <div className="text-3xl font-extrabold tracking-tight text-zinc-900">{formatMinutes(totalWorked)}</div>
        </div>
        <div className="bg-white border border-zinc-200/60 p-6 rounded-3xl text-center shadow-sm">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2">Рабочих дней</div>
          <div className="text-3xl font-extrabold tracking-tight text-zinc-900">{workDaysCount}</div>
        </div>
        <div className="bg-white border border-zinc-200/60 p-6 rounded-3xl text-center shadow-sm">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2">В среднем в день</div>
          <div className="text-3xl font-extrabold tracking-tight text-zinc-900">{formatMinutes(avgPerDay)}</div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Сводка по проектам</h3>
        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Проект</th>
                <th className="px-6 py-4">Факт</th>
                <th className="px-6 py-4">План</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {projectSummary.map((ps, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-zinc-900">
                    <button 
                      onClick={() => onSelectProject && onSelectProject(ps.id)}
                      className="hover:text-zinc-600 focus:outline-none transition-colors text-left"
                      title="Перейти в карточку проекта"
                    >
                      {ps.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-800">{formatMinutes(ps.fact)}</td>
                  <td className="px-6 py-4 font-medium text-zinc-500">{formatMinutes(ps.plan)}</td>
                </tr>
              ))}
              {projectSummary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-400">Нет данных за этот месяц</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
