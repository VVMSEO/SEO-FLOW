import React, { useState } from 'react';
import { Project, AccessItem } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Plus, Trash2, Key, Copy, Check, Eye, EyeOff, Lock, User, Link as LinkIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function AccessesTab({ project, updateProject }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Админ панель');
  const [newUrl, setNewUrl] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: AccessItem = {
      id: uuidv4(),
      title: newTitle,
      category: newCategory,
      url: newUrl,
      login: newLogin,
      password: newPassword
    };

    updateProject(project.id, {
      accesses: [newItem, ...(project.accesses || [])]
    });

    setNewTitle('');
    setNewUrl('');
    setNewLogin('');
    setNewPassword('');
    setIsAdding(false);
  };

  const removeItem = (itemId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот доступ?')) {
      updateProject(project.id, { 
        accesses: (project.accesses || []).filter(i => i.id !== itemId) 
      });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const accesses = project.accesses || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Доступы к проекту</h2>
          <p className="text-sm text-slate-500">Админка, хостинг, регистраторы доменов, метрика и т.д.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Добавить доступ
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 border-slate-200 shadow-sm bg-blue-50/30">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Название</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Например: Админка WordPress" className="bg-white border-slate-300" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Категория</label>
                <Select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="bg-white border-slate-300">
                  <option value="Админ панель">Админ панель</option>
                  <option value="Хостинг">Хостинг</option>
                  <option value="FTP / SSH">FTP / SSH</option>
                  <option value="Домен">Домен</option>
                  <option value="Аналитика">Аналитика (Я.Метрика, Google)</option>
                  <option value="Прочее">Прочее</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Ссылка (URL)</label>
                <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="bg-white border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Логин</label>
                <Input value={newLogin} onChange={e => setNewLogin(e.target.value)} placeholder="admin" className="bg-white border-slate-300" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Пароль</label>
                <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="bg-white border-slate-300 font-mono" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Отмена</Button>
              <Button type="submit" disabled={!newTitle.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">Сохранить</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {accesses.length === 0 && !isAdding ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Key className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Доступы пока не добавлены.</p>
            <p className="text-sm text-slate-400 mt-1">Здесь безопасно и удобно хранить пароли от админок и сервисов.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {accesses.map(access => (
              <Card key={access.id} className="p-0 overflow-hidden border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Key className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{access.title}</h3>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-medium">
                          {access.category}
                        </span>
                        {access.url && (
                          <a href={access.url.startsWith('http') ? access.url : `http://${access.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            Открыть ссылку
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(access.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 bg-white flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  {/* Credentials */}
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><User className="h-3 w-3" /> Логин</div>
                      <div className="font-mono text-sm text-slate-800 break-all">{access.login || '—'}</div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><Lock className="h-3 w-3" /> Пароль</div>
                      <div className="font-mono text-sm text-slate-800 flex items-center gap-2">
                        <span>{visiblePasswords[access.id] ? access.password : '••••••••••••'}</span>
                        {access.password && (
                          <button onClick={() => togglePasswordVisibility(access.id)} className="text-slate-400 hover:text-slate-600">
                            {visiblePasswords[access.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(access.login || '', access.id + '-login')}
                      className="h-8 bg-white"
                      disabled={!access.login}
                    >
                      {copiedId === access.id + '-login' ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5 text-slate-400" />}
                      <span className="text-xs">Логин</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(access.password || '', access.id + '-pass')}
                      className="h-8 bg-white"
                      disabled={!access.password}
                    >
                      {copiedId === access.id + '-pass' ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5 text-slate-400" />}
                      <span className="text-xs">Пароль</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
