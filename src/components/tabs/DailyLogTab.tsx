import React, { useState } from 'react';
import { Project, DailyLogItem, DailyLogCategory } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Plus, Trash2, Clock, Send, Edit2, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function DailyLogTab({ project, updateProject }: Props) {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState<DailyLogCategory>('Прочее');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTime, setNewTime] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<DailyLogItem>>({});

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const newItem: DailyLogItem = {
      id: uuidv4(),
      date: newDate,
      category: newCategory,
      description: newDesc,
      url: newUrl,
      timeSpent: newTime
    };

    updateProject(project.id, {
      dailyLog: [newItem, ...(project.dailyLog || [])]
    });

    setNewDesc('');
    setNewUrl('');
    setNewTime('');
    // Keep date and category same for consecutive fast-entry
  };

  const removeItem = (itemId: string) => {
    if (window.confirm("Удалить это действие?")) {
      updateProject(project.id, { 
        dailyLog: (project.dailyLog || []).filter(i => i.id !== itemId) 
      });
    }
  };

  const startEditing = (item: DailyLogItem) => {
    setEditingId(item.id);
    setEditItem(item);
  };

  const saveEdit = () => {
    if (!editItem.id) return;
    
    updateProject(project.id, {
      dailyLog: (project.dailyLog || []).map(item => 
        item.id === editItem.id ? { ...item, ...editItem } as DailyLogItem : item
      )
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItem({});
  };

  const logs = project.dailyLog || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Лента микро-действий</h2>
          <p className="text-sm text-slate-500">Быстрая запись рутинных задач, правок и проверок, которые не тянут на полноценную задачу, но важны для отчётности.</p>
        </div>
      </div>

      <Card className="p-4 border-slate-200 shadow-sm bg-blue-50/50">
        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
            <Input 
              type="date" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)} 
              className="w-36 h-9 text-xs font-semibold border-slate-300 bg-white"
            />
            <Select 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value as DailyLogCategory)} 
              className="w-48 h-9 text-xs font-medium border-slate-300 bg-white"
            >
              <option value="Аналитика/Вебмастер">Аналитика / Вебмастер</option>
              <option value="Метатеги">Правки метатегов</option>
              <option value="Контент">Работа с текстом/контентом</option>
              <option value="Тех. правки">Технические правки</option>
              <option value="Ссылки">Работа со ссылками</option>
              <option value="Прочее">Прочее</option>
            </Select>
            <Input 
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)} 
              placeholder="С какими URL работал (необязательно)" 
              className="flex-1 h-9 text-xs border-slate-300 bg-white min-w-[200px]"
            />
            <Input 
              value={newTime} 
              onChange={e => setNewTime(e.target.value)} 
              placeholder="Время, напр: 30м" 
              className="w-32 h-9 text-xs border-slate-300 bg-white"
              title="Затраченное время"
            />
          </div>
          <div className="flex gap-2">
            <Input 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              placeholder="Что было сделано? (нажмите Enter для быстрого сохранения)" 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubmit(e);
                }
              }}
              className="flex-1 h-10 border-slate-300 bg-white placeholder:text-slate-400 font-medium font-sans"
            />
            <Button type="submit" disabled={!newDesc.trim()} className="h-10 bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm px-6">
              <Send className="h-4 w-4 mr-2" />
              В ленту
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Лента пуста. Добавьте первое микро-действие.</p>
          </div>
        ) : (
          logs.map(item => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="bg-white p-3 rounded-xl border border-blue-400 shadow-md space-y-3">
                  <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                    <Input 
                      type="date" 
                      value={editItem.date || ''} 
                      onChange={e => setEditItem({...editItem, date: e.target.value})} 
                      className="w-36 h-9 text-xs font-semibold border-slate-300"
                    />
                    <Select 
                      value={editItem.category || 'Прочее'} 
                      onChange={e => setEditItem({...editItem, category: e.target.value as DailyLogCategory})} 
                      className="w-48 h-9 text-xs font-medium border-slate-300"
                    >
                      <option value="Аналитика/Вебмастер">Аналитика / Вебмастер</option>
                      <option value="Метатеги">Правки метатегов</option>
                      <option value="Контент">Работа с текстом/контентом</option>
                      <option value="Тех. правки">Технические правки</option>
                      <option value="Ссылки">Работа со ссылками</option>
                      <option value="Прочее">Прочее</option>
                    </Select>
                    <Input 
                      value={editItem.url || ''} 
                      onChange={e => setEditItem({...editItem, url: e.target.value})} 
                      placeholder="URL..." 
                      className="flex-1 h-9 text-xs border-slate-300 min-w-[200px]"
                    />
                    <Input 
                      value={editItem.timeSpent || ''} 
                      onChange={e => setEditItem({...editItem, timeSpent: e.target.value})} 
                      placeholder="Время (30м)" 
                      className="w-32 h-9 text-xs border-slate-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={editItem.description || ''} 
                      onChange={e => setEditItem({...editItem, description: e.target.value})} 
                      className="flex-1 h-10 border-slate-300 font-medium"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEdit();
                        } else if (e.key === 'Escape') {
                           cancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <Button onClick={saveEdit} className="h-10 bg-green-600 hover:bg-green-700 text-white shrink-0 px-4" title="Сохранить">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" className="h-10 text-slate-500 shrink-0 px-4" title="Отменить">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group flex flex-col md:flex-row md:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 md:w-56 shrink-0 text-slate-500 text-xs">
                    <span className="font-semibold text-slate-700">{item.date}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 font-medium">
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-800 break-words">{item.description}</span>
                    {item.url && (
                      <span className="text-xs text-blue-500 truncate mt-0.5" title={item.url}>{item.url}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0 shrink-0">
                    {item.timeSpent && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md mr-1">
                        <Clock className="w-3 h-3" />
                        {item.timeSpent}
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => startEditing(item)} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(item.id)} 
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
