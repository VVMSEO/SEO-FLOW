import React from 'react';
import { Project, QueueItem, TaskLayer, QueueDecision, QueueStatus } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function QueueTab({ project, updateProject }: Props) {
  const addQueueItem = () => {
    const newItem: QueueItem = {
      id: uuidv4(),
      addedDate: new Date().toISOString().split('T')[0],
      source: '',
      name: '',
      layer: 'Техничка',
      impact: 0,
      urgency: 0,
      dependency: 0,
      dataConfirmation: 0,
      effort: 0,
      priority: 0,
      decision: 'Оставить в очереди',
      status: 'Новая',
      whenToTake: ''
    };
    
    updateProject(project.id, { queue: [newItem, ...project.queue] });
  };

  const updateItem = (itemId: string, updates: Partial<QueueItem>) => {
    const updatedQueue = project.queue.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        // Recalculate priority if metrics changed
        if ('impact' in updates || 'urgency' in updates || 'dependency' in updates || 'dataConfirmation' in updates || 'effort' in updates) {
          updated.priority = Number(updated.impact) + Number(updated.urgency) + Number(updated.dependency) + Number(updated.dataConfirmation) - Number(updated.effort);
        }
        return updated;
      }
      return item;
    });
    updateProject(project.id, { queue: updatedQueue });
  };

  const removeItem = (itemId: string) => {
    updateProject(project.id, { queue: project.queue.filter(i => i.id !== itemId) });
  };

  const moveToCurrent = (item: QueueItem) => {
    if (project.tasks.length >= 5) {
      alert("WIP-лимит: не больше 5 активных задач одновременно.");
      return;
    }
    
    const newTask = {
      id: uuidv4(),
      name: item.name,
      layer: item.layer,
      priority: 'C' as const,
      assignee: 'Я',
      status: 'Сделать сейчас' as const,
      startDate: new Date().toISOString().split('T')[0],
      whatToCheck: ''
    };
    
    updateProject(project.id, { 
      tasks: [...project.tasks, newTask],
      queue: project.queue.filter(i => i.id !== item.id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Очередь (Бэклог)</h2>
          <p className="text-sm text-slate-500">Банк идей и задач. Оценивайте и выбирайте лучшее.</p>
        </div>
        <Button onClick={addQueueItem} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Добавить идею
        </Button>
      </div>

      <div className="space-y-4">
        {project.queue.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Очередь пуста. Записывайте сюда все найденные проблемы и идеи.</p>
          </div>
        ) : (
          project.queue.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Main Info */}
                <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-200 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={item.name} 
                      onChange={e => updateItem(item.id, { name: e.target.value })} 
                      placeholder="Суть задачи/идеи..." 
                      className="font-semibold text-base h-auto py-1 px-0 border-none shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Источник</label>
                      <Input value={item.source} onChange={e => updateItem(item.id, { source: e.target.value })} placeholder="GSC, Аудит..." className="h-8 text-xs border-slate-200 bg-slate-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Слой</label>
                      <Select value={item.layer} onChange={e => updateItem(item.id, { layer: e.target.value as TaskLayer })} className="h-8 text-xs border-slate-200 bg-slate-50">
                        <option value="Техничка">Техничка</option>
                        <option value="Индексация">Индексация</option>
                        <option value="Структура">Структура</option>
                        <option value="On-page">On-page</option>
                        <option value="CTR">CTR</option>
                        <option value="Качество">Качество</option>
                        <option value="Поддержка">Поддержка</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Когда взять</label>
                      <Input value={item.whenToTake} onChange={e => updateItem(item.id, { whenToTake: e.target.value })} placeholder="Ориентир..." className="h-8 text-xs border-slate-200 bg-slate-50" />
                    </div>
                  </div>
                </div>
                
                {/* Scoring */}
                <div className="w-full md:w-72 p-5 bg-slate-50 flex flex-col justify-between">
                  <div className="grid grid-cols-5 gap-2 text-center mb-4">
                    <div title="Влияние (0-2)">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Влиян</label>
                      <Input type="number" min="0" max="2" value={item.impact} onChange={e => updateItem(item.id, { impact: parseInt(e.target.value) || 0 })} className="h-8 text-sm px-1 text-center font-medium border-slate-200 bg-white" />
                    </div>
                    <div title="Срочность (0-2)">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Срочн</label>
                      <Input type="number" min="0" max="2" value={item.urgency} onChange={e => updateItem(item.id, { urgency: parseInt(e.target.value) || 0 })} className="h-8 text-sm px-1 text-center font-medium border-slate-200 bg-white" />
                    </div>
                    <div title="Зависимость (0-2)">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Завис</label>
                      <Input type="number" min="0" max="2" value={item.dependency} onChange={e => updateItem(item.id, { dependency: parseInt(e.target.value) || 0 })} className="h-8 text-sm px-1 text-center font-medium border-slate-200 bg-white" />
                    </div>
                    <div title="Подтверждение данными (0-2)">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Данн</label>
                      <Input type="number" min="0" max="2" value={item.dataConfirmation} onChange={e => updateItem(item.id, { dataConfirmation: parseInt(e.target.value) || 0 })} className="h-8 text-sm px-1 text-center font-medium border-slate-200 bg-white" />
                    </div>
                    <div title="Трудозатраты (0-2)">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Труд</label>
                      <Input type="number" min="0" max="2" value={item.effort} onChange={e => updateItem(item.id, { effort: parseInt(e.target.value) || 0 })} className="h-8 text-sm px-1 text-center font-medium border-slate-200 bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Приоритет: <span className="text-blue-600 text-sm ml-1">{item.priority}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => moveToCurrent(item)} title="Взять в работу" className="h-8 w-8 border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
