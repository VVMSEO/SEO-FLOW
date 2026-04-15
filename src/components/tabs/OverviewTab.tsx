import React from 'react';
import { Project } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function OverviewTab({ project, updateProject }: Props) {
  const handleChange = (field: keyof Project, value: any) => {
    updateProject(project.id, { [field]: value });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Домен</div>
          <Input value={project.domain} onChange={e => handleChange('domain', e.target.value)} placeholder="example.com" className="font-semibold text-base border-none shadow-none px-0 h-auto focus-visible:ring-0" />
        </Card>
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Ниша</div>
          <Input value={project.niche} onChange={e => handleChange('niche', e.target.value)} placeholder="e.g. E-commerce" className="font-semibold text-base border-none shadow-none px-0 h-auto focus-visible:ring-0" />
        </Card>
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Статус</div>
          <Select value={project.status} onChange={e => handleChange('status', e.target.value)} className="font-semibold text-base border-none shadow-none px-0 h-auto focus:ring-0">
            <option value="Зелёный">🟢 Зелёный</option>
            <option value="Жёлтый">🟡 Жёлтый</option>
            <option value="Красный">🔴 Красный</option>
          </Select>
        </Card>
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Стадия</div>
          <Select value={project.stage} onChange={e => handleChange('stage', e.target.value)} className="font-semibold text-base border-none shadow-none px-0 h-auto focus:ring-0">
            <option value="Диагностика">Диагностика</option>
            <option value="Стабилизация">Стабилизация</option>
            <option value="Индексация">Индексация</option>
            <option value="Структура">Структура</option>
            <option value="On-page">On-page</option>
            <option value="CTR и сниппет">CTR и сниппет</option>
            <option value="Поддержка">Поддержка</option>
          </Select>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Регион</div>
          <Input value={project.region} onChange={e => handleChange('region', e.target.value)} placeholder="Москва" className="font-semibold text-base border-none shadow-none px-0 h-auto focus-visible:ring-0" />
        </Card>
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Бюджет (₽/мес)</div>
          <Input value={project.budget} onChange={e => handleChange('budget', e.target.value)} placeholder="100 000" className="font-semibold text-base border-none shadow-none px-0 h-auto focus-visible:ring-0" />
        </Card>
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.05em] text-slate-500 mb-1">Главный KPI</div>
          <Input value={project.kpi} onChange={e => handleChange('kpi', e.target.value)} placeholder="Лиды, заявки..." className="font-semibold text-base border-none shadow-none px-0 h-auto focus-visible:ring-0" />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 relative overflow-hidden border-l-4 border-l-blue-600">
          <div className="text-sm font-bold mb-2 flex items-center gap-2 uppercase tracking-wide">Фокус месяца</div>
          <Textarea value={project.focus} onChange={e => handleChange('focus', e.target.value)} placeholder="Например: индексация каталога..." className="text-lg font-normal leading-relaxed border-none shadow-none px-0 resize-y focus-visible:ring-0 min-h-[80px]" />
        </Card>
        
        <Card className="p-6 relative overflow-hidden border-l-4 border-l-red-500">
          <div className="text-sm font-bold mb-2 flex items-center gap-2 uppercase tracking-wide">Узкое место</div>
          <Textarea value={project.bottleneck} onChange={e => handleChange('bottleneck', e.target.value)} placeholder="Опишите узкое место..." className="text-lg font-normal leading-relaxed border-none shadow-none px-0 resize-y focus-visible:ring-0 min-h-[80px]" />
        </Card>
      </div>

      <div className="bg-blue-600 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="flex-1 w-full">
          <h2 className="text-xs uppercase opacity-80 mb-2 tracking-[0.1em]">Следующий шаг</h2>
          <Textarea value={project.nextStep} onChange={e => handleChange('nextStep', e.target.value)} placeholder="Что нужно сделать прямо сейчас?" className="text-2xl md:text-3xl font-semibold border-none shadow-none px-0 resize-y bg-transparent text-white placeholder:text-blue-200 focus-visible:ring-0 min-h-[80px] w-full" />
        </div>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0 hidden md:block"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>

      <Card className="p-5 mt-4 border-slate-200">
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-slate-700">Настройки Telegram уведомлений</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Bot Token</label>
            <Input type="password" value={project.telegramBotToken || ''} onChange={e => handleChange('telegramBotToken', e.target.value)} placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" className="font-mono text-xs border-slate-200" />
            <p className="text-[10px] text-slate-400">Токен бота от @BotFather</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Chat ID</label>
            <Input value={project.telegramChatId || ''} onChange={e => handleChange('telegramChatId', e.target.value)} placeholder="-1001234567890" className="font-mono text-xs border-slate-200" />
            <p className="text-[10px] text-slate-400">ID чата или пользователя (можно узнать через @userinfobot)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
