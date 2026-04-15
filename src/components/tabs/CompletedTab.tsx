import React from 'react';
import { Project, CompletedItem, TaskLayer, TaskPriority, CompletedResult } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function CompletedTab({ project, updateProject }: Props) {
  const addCompletedItem = () => {
    const newItem: CompletedItem = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      name: '',
      layer: 'Техничка',
      priority: 'C',
      assignee: 'Я',
      result: 'Выполнено'
    };
    
    updateProject(project.id, { completed: [newItem, ...project.completed] });
  };

  const updateItem = (itemId: string, updates: Partial<CompletedItem>) => {
    const updatedCompleted = project.completed.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateProject(project.id, { completed: updatedCompleted });
  };

  const removeItem = (itemId: string) => {
    updateProject(project.id, { completed: project.completed.filter(i => i.id !== itemId) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Завершённое</h2>
          <p className="text-sm text-slate-500">Архив закрытых задач. История выполненного без захламления активного листа.</p>
        </div>
        <Button onClick={addCompletedItem} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
          <Plus className="h-4 w-4 mr-2" />
          Добавить в архив
        </Button>
      </div>

      <div className="space-y-3">
        {project.completed.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Архив пуст. Сюда попадают полностью закрытые задачи.</p>
          </div>
        ) : (
          project.completed.map(item => (
            <Card key={item.id} className="opacity-80 hover:opacity-100 transition-opacity">
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-full md:w-36 shrink-0">
                    <Input 
                      type="date" 
                      value={item.date} 
                      onChange={e => updateItem(item.id, { date: e.target.value })} 
                      className="h-9 text-xs font-medium border-slate-200 bg-slate-50"
                    />
                  </div>
                  
                  <div className="flex-1 w-full space-y-2">
                    <Textarea 
                      value={item.name} 
                      onChange={e => updateItem(item.id, { name: e.target.value })} 
                      placeholder="Название закрытой задачи..." 
                      className="min-h-[40px] text-sm font-semibold border-slate-200 focus-visible:ring-blue-600 resize-y"
                    />
                    <Input 
                      value={item.docLink || ''} 
                      onChange={e => updateItem(item.id, { docLink: e.target.value })} 
                      placeholder="Ссылка на ТЗ/Документ..."
                      className="h-8 text-xs border-slate-200 bg-slate-50"
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <Select 
                      value={item.layer} 
                      onChange={e => updateItem(item.id, { layer: e.target.value as TaskLayer })} 
                      className="h-9 text-xs w-32 border-slate-200 bg-slate-50"
                    >
                      <option value="Техничка">Техничка</option>
                      <option value="Индексация">Индексация</option>
                      <option value="Структура">Структура</option>
                      <option value="On-page">On-page</option>
                      <option value="CTR">CTR</option>
                      <option value="Качество">Качество</option>
                      <option value="Поддержка">Поддержка</option>
                    </Select>
                    
                    <Select 
                      value={item.result} 
                      onChange={e => updateItem(item.id, { result: e.target.value as CompletedResult })} 
                      className="h-9 text-xs w-48 border-slate-200 bg-slate-50"
                    >
                      <option value="Выполнено">Выполнено</option>
                      <option value="Частично выполнено">Частично выполнено</option>
                      <option value="Закрыто без внедрения">Закрыто без внедрения</option>
                      <option value="Отменено">Отменено</option>
                      <option value="Передано клиенту">Передано клиенту</option>
                      <option value="Передано разработчику">Передано разработчику</option>
                    </Select>
                    
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
