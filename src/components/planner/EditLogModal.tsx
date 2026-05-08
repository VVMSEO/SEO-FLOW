import React, { useState, useEffect } from 'react';
import { formatMinutes } from '../../utils/timeCalc';

interface EditLogModalProps {
  log: any;
  projects: any[];
  onSave: (id: string, updates: any) => void;
  onClose: () => void;
}

export function EditLogModal({ log, projects, onSave, onClose }: EditLogModalProps) {
  const [projectId, setProjectId] = useState(log.projectId || '');
  const [date, setDate] = useState(log.date || '');
  const [planHours, setPlanHours] = useState(Math.floor((log.minutes || 0) / 60));
  const [planMinutes, setPlanMinutes] = useState((log.minutes || 0) % 60);
  const [factHours, setFactHours] = useState(Math.floor((log.workedMinutes || 0) / 60));
  const [factMinutes, setFactMinutes] = useState((log.workedMinutes || 0) % 60);
  const [task, setTask] = useState(log.task || '');
  const [status, setStatus] = useState(log.status || 'Не начата');
  const [result, setResult] = useState(log.result || '');

  const handleSave = () => {
    const p = projects.find((x: any) => x.id === projectId);
    
    // We update all the edited values
    onSave(log.id, {
      projectId,
      projectName: p?.name || '',
      date,
      minutes: Number(planHours) * 60 + Number(planMinutes),
      workedMinutes: Number(factHours) * 60 + Number(factMinutes),
      task,
      status,
      result
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Редактировать сеанс</h2>
          
          <div className="space-y-4">
            {/* Project */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Проект</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Без проекта</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category (Optional) placeholder */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Категория (опционально)</label>
              <select className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">Без категории</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Plan Time */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">План (часы)</label>
                <input
                  type="number"
                  min="0"
                  value={planHours}
                  onChange={(e) => setPlanHours(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">План (минуты)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={planMinutes}
                  onChange={(e) => setPlanMinutes(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Fact Time */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-blue-600 mb-1">Факт (часы)</label>
                <input
                  type="number"
                  min="0"
                  value={factHours}
                  onChange={(e) => setFactHours(Number(e.target.value))}
                  className="w-full text-sm border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-blue-50/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-blue-600 mb-1">Факт (минуты)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={factMinutes}
                  onChange={(e) => setFactMinutes(Number(e.target.value))}
                  className="w-full text-sm border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-blue-50/50"
                />
              </div>
            </div>

            {/* Task */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Задача</label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Не начата">Не начата</option>
                <option value="В работе">В работе</option>
                <option value="Сделана">Сделана</option>
              </select>
            </div>

            {/* Result */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Результат (опционально)</label>
              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={3}
                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 flex justify-end gap-3 mt-auto bg-white rounded-b-lg border-t border-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
