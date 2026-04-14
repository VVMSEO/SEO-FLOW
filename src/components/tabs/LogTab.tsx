import React from 'react';
import { Project, LogItem, EffectStatus } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function LogTab({ project, updateProject }: Props) {
  const addLogItem = () => {
    const newItem: LogItem = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      whatWasDone: '',
      why: '',
      whatToCheck: '',
      effectStatus: 'Сделано',
      reportString: ''
    };
    
    updateProject(project.id, { log: [newItem, ...project.log] });
  };

  const updateItem = (itemId: string, updates: Partial<LogItem>) => {
    const updatedLog = project.log.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        // Auto-generate report string if not manually edited
        if (!updates.reportString && ('whatWasDone' in updates || 'why' in updates)) {
          updated.reportString = `${updated.whatWasDone}. Цель: ${updated.why}`;
        }
        return updated;
      }
      return item;
    });
    updateProject(project.id, { log: updatedLog });
  };

  const removeItem = (itemId: string) => {
    updateProject(project.id, { log: project.log.filter(i => i.id !== itemId) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Журнал изменений</h2>
          <p className="text-sm text-slate-500">Фиксация фактов работы и отслеживание эффекта.</p>
        </div>
        <Button onClick={addLogItem} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Добавить запись
        </Button>
      </div>

      <div className="space-y-4">
        {project.log.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Журнал пуст. Записывайте сюда завершенные блоки работ.</p>
          </div>
        ) : (
          project.log.map(item => (
            <Card key={item.id}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <Input 
                      type="date" 
                      value={item.date} 
                      onChange={e => updateItem(item.id, { date: e.target.value })} 
                      className="w-36 h-9 text-sm font-semibold border-slate-200 bg-slate-50"
                    />
                    <Select 
                      value={item.effectStatus} 
                      onChange={e => updateItem(item.id, { effectStatus: e.target.value as EffectStatus })} 
                      className="w-56 h-9 text-xs font-medium border-slate-200 bg-slate-50"
                    >
                      <option value="Сделано">Сделано</option>
                      <option value="Ожидается переобход">Ожидается переобход</option>
                      <option value="Ожидается индексация">Ожидается индексация</option>
                      <option value="Ожидается накопление данных">Ожидается накопление данных</option>
                      <option value="Проверить повторно">Проверить повторно</option>
                      <option value="Требуется доработка">Требуется доработка</option>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Что сделали</label>
                      <Textarea 
                        value={item.whatWasDone} 
                        onChange={e => updateItem(item.id, { whatWasDone: e.target.value })} 
                        placeholder="Законченный SEO-блок работ..."
                        className="min-h-[80px] text-sm border-slate-200 focus-visible:ring-blue-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Зачем (Цель)</label>
                      <Input 
                        value={item.why} 
                        onChange={e => updateItem(item.id, { why: e.target.value })} 
                        placeholder="Индексация, расширение спроса..."
                        className="h-9 text-sm border-slate-200 focus-visible:ring-blue-600"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Что проверить</label>
                      <Input 
                        value={item.whatToCheck} 
                        onChange={e => updateItem(item.id, { whatToCheck: e.target.value })} 
                        placeholder="Контроль результата..."
                        className="h-9 text-sm border-slate-200 focus-visible:ring-blue-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Строка для отчёта</label>
                      <Textarea 
                        value={item.reportString} 
                        onChange={e => updateItem(item.id, { reportString: e.target.value })} 
                        placeholder="Формулировка для клиента..."
                        className="min-h-[80px] text-sm bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                      />
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
