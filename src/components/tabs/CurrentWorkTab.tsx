import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, TaskLayer, TaskPriority, TaskStatus } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Plus, Trash2, CheckCircle2, Bell, ArrowDownToLine, CheckSquare, Play, Square, MessageSquare, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { sendTelegramMessage } from '../../lib/telegram';
import { useTimer } from '../../context/TimerContext';
import { useTimeLogs } from '../../hooks/useTimeLogs';
import { LiveTimerDisplay } from '../ui/LiveTimerDisplay';
import { useSettings } from '../../hooks/useSettings';

interface Props {
  project: Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export function CurrentWorkTab({ project, updateProject }: Props) {
  const hasCheckedReminders = useRef(false);
  const [checkTrigger, setCheckTrigger] = useState(0);
  const { activeTimer, startTimer, stopTimer } = useTimer();
  const { logs, addLog, updateLog: updateTimeLog } = useTimeLogs();
  const { settings } = useSettings();
  const [actionInputs, setActionInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hasCheckedReminders.current && checkTrigger === 0) return;
    if (!settings?.tgToken || !settings?.tgChatId) return;

    const checkAndSendReminders = async () => {
      hasCheckedReminders.current = true;
      const today = new Date().toISOString().split('T')[0];
      let hasUpdates = false;
      const updatedTasks = [...project.tasks];

      for (let i = 0; i < updatedTasks.length; i++) {
        const task = updatedTasks[i];
        if (task.status === 'Сделано' || task.status === 'Отменено') continue;

        // Check Overdue
        if (task.deadline && task.deadline < today && task.lastOverdueReminder !== today) {
          const msg = `⚠️ <b>Просроченная задача!</b>\n\n<b>Проект:</b> ${project.name}\n<b>Задача:</b> ${task.name}\n<b>Дедлайн:</b> ${task.deadline}\n<b>Ответственный:</b> ${task.assignee}`;
          const success = await sendTelegramMessage(settings.tgToken, settings.tgChatId, msg);
          if (success) {
            updatedTasks[i] = { ...updatedTasks[i], lastOverdueReminder: today };
            hasUpdates = true;
          }
        }

        // Check Next Check Date
        if (task.nextCheckDate && task.nextCheckDate <= today && task.lastCheckReminder !== today) {
          const msg = `🔍 <b>Пора проверить задачу!</b>\n\n<b>Проект:</b> ${project.name}\n<b>Задача:</b> ${task.name}\n<b>Что проверить:</b> ${task.whatToCheck || 'Не указано'}`;
          const success = await sendTelegramMessage(settings.tgToken, settings.tgChatId, msg);
          if (success) {
            updatedTasks[i] = { ...updatedTasks[i], lastCheckReminder: today };
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        updateProject(project.id, { tasks: updatedTasks });
      }
    };

    checkAndSendReminders();
  }, [project.id, settings?.tgToken, settings?.tgChatId, project.tasks, project.name, updateProject, checkTrigger]);

  const addTask = () => {
    if (project.tasks.length >= 5) {
      alert("WIP-лимит: не больше 5 активных задач одновременно.");
      return;
    }
    
    const newTask: Task = {
      id: uuidv4(),
      name: '',
      layer: 'Техничка',
      priority: 'B',
      assignee: 'Я',
      status: 'Сделать сейчас',
      startDate: new Date().toISOString().split('T')[0],
      whatToCheck: ''
    };
    
    updateProject(project.id, { tasks: [...project.tasks, newTask] });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    updateProject(project.id, { tasks: updatedTasks });
  };

  const removeTask = (taskId: string) => {
    updateProject(project.id, { tasks: project.tasks.filter(t => t.id !== taskId) });
  };

  const moveToCompleted = (task: Task) => {
    const newItem = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      name: task.name,
      layer: task.layer,
      priority: task.priority,
      assignee: task.assignee,
      result: 'Выполнено' as const,
      whatToCheck: task.whatToCheck,
      docLink: task.docLink,
      actions: task.actions
    };
    updateProject(project.id, {
      completed: [newItem, ...project.completed],
      tasks: project.tasks.filter(t => t.id !== task.id)
    });
  };

  const moveToQueue = (task: Task) => {
    const newItem = {
      id: uuidv4(),
      addedDate: new Date().toISOString().split('T')[0],
      source: 'Из тек. работы',
      name: task.name,
      layer: task.layer,
      impact: 0,
      urgency: 0,
      dependency: 0,
      dataConfirmation: 0,
      effort: 0,
      priority: 0,
      decision: 'Отложить' as const,
      status: 'Заморожена' as const,
      whenToTake: '',
      url: task.docLink
    };
    updateProject(project.id, {
      queue: [newItem, ...project.queue],
      tasks: project.tasks.filter(t => t.id !== task.id)
    });
  };

  const handleToggleTimer = async (task: Task) => {
    // If tracking this exact task, stop it
    if (activeTimer && activeTimer.task === task.name && activeTimer.projectName === project.name) {
      await stopTimer();
      return;
    }

    // Stop current timer if any
    if (activeTimer) {
      await stopTimer();
    }

    // 1. Try to find a TimeLog for today for this project and task
    const today = new Date().toISOString().split('T')[0];
    let logToUse = logs.find(l => l.date === today && l.projectId === project.id && l.task === task.name);
    
    // 2. If no log exists or we don't have an exact match by task name, maybe find a log with empty task? Let's just create one.
    if (!logToUse) {
      logToUse = await addLog({
        projectId: project.id,
        projectName: project.name,
        date: today,
        task: task.name || '',
        status: 'В работе',
        minutes: 0,
        workedMinutes: 0
      }) as any;
    }

    if (logToUse) {
      startTimer(logToUse);
    }
  };

  const addTaskAction = (taskId: string) => {
    const text = actionInputs[taskId]?.trim();
    if (!text) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newAction = {
      id: uuidv4(),
      text,
      date: new Date().toISOString(),
      isDone: false
    };

    updateTask(taskId, {
      actions: [...(task.actions || []), newAction]
    });

    setActionInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const toggleTaskAction = (taskId: string, actionId: string) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedActions = (task.actions || []).map(a => 
      a.id === actionId ? { ...a, isDone: !a.isDone } : a
    );

    updateTask(taskId, { actions: updatedActions });
  };

  const removeTaskAction = (taskId: string, actionId: string) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedActions = (task.actions || []).filter(a => a.id !== actionId);

    updateTask(taskId, { actions: updatedActions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Текущая работа</h2>
          <p className="text-sm text-zinc-500 mt-1">Активные задачи (WIP-лимит: 3-5). Сейчас в работе: {project.tasks.length}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              if (!settings?.tgToken || !settings?.tgChatId) {
                alert("Сначала настройте Telegram Bot Token и Chat ID во вкладке 'Обзор' или в глобальных настройках");
                return;
              }
              setCheckTrigger(prev => prev + 1);
              alert("Проверка уведомлений запущена. Если есть просроченные задачи, они будут отправлены в Telegram.");
            }} 
            variant="outline" 
            className="text-zinc-600 border-zinc-200 hover:bg-zinc-100"
            title="Проверить и отправить уведомления"
          >
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </Button>
          <Button onClick={addTask} disabled={project.tasks.length >= 5} className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Добавить задачу
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {project.tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-300"
            >
              <p className="text-zinc-500">Нет активных задач. Возьмите задачу из очереди или создайте новую.</p>
            </motion.div>
          ) : (
            project.tasks.map(task => {
              const isActive = activeTimer && activeTimer.task === task.name && activeTimer.projectName === project.name;
              
              return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
              <Card className={cn("overflow-hidden rounded-2xl border-zinc-200/60 shadow-sm transition-all", task.status === 'Сделано' ? 'opacity-60 grayscale-[0.5]' : '', isActive ? 'ring-2 ring-zinc-900 shadow-md transform -translate-y-0.5' : 'hover:shadow-md')}>
              <div className={cn("p-5 border-b border-zinc-100", isActive ? 'bg-zinc-50/80' : 'bg-white')}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-900 uppercase tracking-wide bg-zinc-100 border border-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
                          В процессе
                        </span>
                      ) : (
                        <span className={cn(
                          "text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold inline-block border tracking-wide",
                          task.status === 'В работе' ? "bg-blue-50 text-blue-600 border-blue-200" :
                          task.status === 'Ждёт клиента' ? "bg-orange-50 text-orange-600 border-orange-200" :
                          task.status === 'Проверка результата' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          task.status === 'Сделано' ? "bg-zinc-100 text-zinc-500 border-zinc-200" :
                          task.status === 'Сделать сейчас' ? "bg-zinc-100 text-zinc-800 border-zinc-200" :
                          "bg-zinc-50 text-zinc-600 border-zinc-200"
                        )}>
                          {task.status}
                        </span>
                      )}
                      
                      {isActive && activeTimer && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium bg-white px-2 py-0.5 rounded-full border border-zinc-200 shadow-sm">
                          <span>Факт:</span>
                          <LiveTimerDisplay startTime={activeTimer.startTime} initialMinutes={activeTimer.initialWorkedMinutes} />
                        </div>
                      )}
                    </div>
                    <Textarea 
                      value={task.name} 
                      onChange={e => updateTask(task.id, { name: e.target.value })} 
                      placeholder="Название задачи..." 
                      className="font-semibold text-base md:text-lg min-h-[40px] py-1 px-0 border-none shadow-none focus-visible:ring-0 resize-y bg-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100/80 shadow-sm">
                    <Select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })} className="w-36 h-8 text-xs border-zinc-200 bg-white rounded-lg">
                      <option value="Сделать сейчас">Сделать сейчас</option>
                      <option value="В работе">В работе</option>
                      <option value="Ждёт клиента">Ждёт клиента</option>
                      <option value="Ждёт разработчика">Ждёт разработчика</option>
                      <option value="Ждёт индексации">Ждёт индексации</option>
                      <option value="Ждёт накопления данных">Ждёт накопления данных</option>
                      <option value="Проверка результата">Проверка результата</option>
                      <option value="Сделано">Сделано</option>
                      <option value="Отменено">Отменено</option>
                    </Select>
                    <div className="w-px h-6 bg-zinc-200 mx-1"></div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleTimer(task)} 
                      className={cn(
                        "h-8 w-8 hover:bg-zinc-200 rounded-lg transition-colors", 
                        activeTimer && activeTimer.task === task.name && activeTimer.projectName === project.name
                          ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white shadow-inner" 
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-white border border-transparent shadow-sm"
                      )} 
                      title={activeTimer && activeTimer.task === task.name && activeTimer.projectName === project.name ? "Остановить таймер" : "Запустить таймер"}
                    >
                      {activeTimer && activeTimer.task === task.name && activeTimer.projectName === project.name ? (
                        <Square className="h-4 w-4" fill="currentColor" />
                      ) : (
                        <Play className="h-4 w-4" fill="currentColor" />
                      )}
                    </Button>
                    <div className="w-px h-6 bg-zinc-200 mx-1"></div>
                    <Button variant="ghost" size="icon" onClick={() => moveToCompleted(task)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8 rounded-lg" title="Перенести в 'Завершенные'">
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveToQueue(task)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8 rounded-lg" title="Вернуть в 'Очередь'">
                      <ArrowDownToLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg" title="Удалить навсегда">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 pt-4 border-t border-zinc-100/80">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Дата начала</label>
                    <Input type="date" value={task.startDate || ''} onChange={e => updateTask(task.id, { startDate: e.target.value })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Слой</label>
                    <Select value={task.layer} onChange={e => updateTask(task.id, { layer: e.target.value as TaskLayer })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors">
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
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Приоритет</label>
                    <Select value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value as TaskPriority })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors">
                      <option value="A">A - Авария</option>
                      <option value="B">B - Блокер роста</option>
                      <option value="C">C - Усилитель</option>
                      <option value="D">D - Бэклог</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Ответственный</label>
                    <Input value={task.assignee} onChange={e => updateTask(task.id, { assignee: e.target.value })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Срок</label>
                    <Input type="date" value={task.deadline || ''} onChange={e => updateTask(task.id, { deadline: e.target.value })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">След. проверка</label>
                    <Input type="date" value={task.nextCheckDate || ''} onChange={e => updateTask(task.id, { nextCheckDate: e.target.value })} className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Ссылка на ТЗ</label>
                    <Input value={task.docLink || ''} onChange={e => updateTask(task.id, { docLink: e.target.value })} placeholder="https://..." className="h-8 text-xs border-zinc-200 bg-zinc-50 hover:bg-white transition-colors" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-100/80 pt-4">
                  <div className="flex flex-col gap-1.5 h-full min-h-[150px]">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">Что проверить</label>
                    <Textarea value={task.whatToCheck} onChange={e => updateTask(task.id, { whatToCheck: e.target.value })} placeholder="Например: страницы в индексе, рост показов..." className="flex-1 w-full text-sm border-zinc-200 bg-zinc-50 hover:bg-white transition-colors focus:bg-white resize-none rounded-xl p-3" />
                  </div>

                  {/* Actions Feed */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Лента действий
                    </label>
                    
                    <div className="flex-1 bg-zinc-50 rounded-xl border border-zinc-200/60 p-2 overflow-y-auto max-h-[150px] min-h-[80px] space-y-1.5 shadow-inner">
                      {task.actions && task.actions.length > 0 ? (
                        task.actions.map(action => (
                          <div key={action.id} className="group flex items-start gap-2.5 text-sm bg-white p-2 rounded-lg border border-zinc-100 shadow-sm transition-all hover:border-zinc-300">
                            <button
                              onClick={() => toggleTaskAction(task.id, action.id)}
                              className={cn(
                                "mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                action.isDone ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300 hover:border-zinc-500"
                              )}
                            >
                              {action.isDone && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                            <div className={cn("flex-1 text-zinc-700 font-medium", action.isDone && "line-through text-zinc-400")}>
                              {action.text}
                            </div>
                            <button
                              onClick={() => removeTaskAction(task.id, action.id)}
                              className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-400 hover:text-red-500 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-400 font-medium text-center py-6 flex flex-col items-center gap-2">
                          <MessageSquare className="w-5 h-5 opacity-20" />
                          Нет записей
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={actionInputs[task.id] || ''}
                        onChange={e => setActionInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTaskAction(task.id);
                          }
                        }}
                        placeholder="Зафиксировать действие..."
                        className="h-9 text-xs border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white transition-colors"
                      />
                      <Button
                        onClick={() => addTaskAction(task.id)}
                        disabled={!actionInputs[task.id]?.trim()}
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            </motion.div>
          )})
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
