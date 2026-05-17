import React, { useState, useEffect } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useTimeLogs } from "../../hooks/useTimeLogs";
import { useSettings } from "../../hooks/useSettings";
import { useTimer } from "../../context/TimerContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { formatMinutes } from "../../utils/timeCalc";
import { cn } from "../../lib/utils";
import {
  addDays,
  startOfWeek,
  format,
  subWeeks,
  addWeeks,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  Plus,
  Play,
  Square,
  Wand2,
  Trash2,
  Calendar,
  Edit2,
  Check,
} from "lucide-react";
import { distributeProjects } from "../../services/aiService";
import { toast } from "sonner";

import { LiveTimerDisplay } from '../ui/LiveTimerDisplay';
import { EditLogModal } from './EditLogModal';

export default function WeekView() {
  const { logs, addLog, updateLog, deleteLog } = useTimeLogs();
  const { projects } = useProjects("");
  const { settings } = useSettings();
  const { activeTimer, startTimer, stopTimer } = useTimer();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isPlanning, setIsPlanning] = useState(false);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const startOfWk = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWk, i),
  );

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const weekLogs = logs.filter((log) => {
    const d = parseISO(log.date);
    return d >= startOfWk && d <= addDays(startOfWk, 6);
  });

  const handleAddSession = (date: Date) => {
    addLog({
      projectId: "",
      projectName: "",
      task: "",
      status: "Не начата",
      date: format(date, "yyyy-MM-dd"),
      minutes: 0,
      workedMinutes: 0,
    });
  };

  const handleSmartPlan = async () => {
    setIsPlanning(true);
    const hourlyRate = Number(settings?.hourlyRate) || 1;

    // Calculate total minutes needed per active project
    const projectsToPlan = projects
      .filter((p: any) => p.active !== false)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        minutes: Math.round(
          (((Number(p.budget) || 0) / (Number(String(p.overhead).replace(',', '.')) || 1)) / hourlyRate) *
            60 / 4.33
        ),
      }))
      .filter((p) => p.minutes > 0);

    if (projectsToPlan.length === 0) {
      toast.error("Нет активных проектов с заданным бюджетом");
      setIsPlanning(false);
      return;
    }

    try {
      const plan = await distributeProjects(projectsToPlan);
      // plan will be like { "schedule": [{ projectId, day (1-5) }] }
      if (plan && plan.schedule) {
        // Clear existing planned logs that have no worked time?
        const unworkedLogs = weekLogs.filter(
          (l) => (l.workedMinutes || 0) === 0,
        );
        for (const dl of unworkedLogs) {
          await deleteLog(dl.id);
        }

        // Add new planned logs
        for (const item of plan.schedule) {
          const proj = projectsToPlan.find((p: any) => p.id === item.projectId);
          if (proj) {
            // Find how many times this project is scheduled to divide minutes
            const timesScheduled = plan.schedule.filter(
              (s: any) => s.projectId === item.projectId,
            ).length;
            const minsPerSession = Math.round(proj.minutes / timesScheduled);
            const dayNum = Number(item.day) || 1;
            const targetDate = addDays(startOfWk, dayNum - 1);

            await addLog({
              projectId: proj.id,
              projectName: proj.name,
              task: "План (AI)",
              status: "Не начата",
              date: format(targetDate, "yyyy-MM-dd"),
              minutes: minsPerSession,
              workedMinutes: 0,
            });
          }
        }
        toast.success("Неделя распланирована");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ошибка авто-планирования");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleClearDrafts = () => {
    if (
      window.confirm(
        "Удалить все сеансы без отработанного времени за эту неделю?",
      )
    ) {
      const unworkedLogs = weekLogs.filter((l) => (l.workedMinutes || 0) === 0);
      unworkedLogs.forEach((l) => deleteLog(l.id));
      toast.success("Черновики очищены");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col hide-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Неделя</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
            onClick={handleClearDrafts}
          >
            Очистить черновики
          </Button>
          <Button
            variant="outline"
            className="text-zinc-600 border-zinc-200 hover:bg-zinc-50 gap-2 rounded-xl"
            onClick={handleSmartPlan}
            disabled={isPlanning}
          >
            <Wand2 size={16} />
            {isPlanning ? "Планируем..." : "Умный план"}
          </Button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-zinc-200 rounded-xl shadow-sm">
            <button
              onClick={handlePrevWeek}
              className="text-zinc-400 hover:text-zinc-900 px-1 transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium text-zinc-700">
              Неделя: <span className="text-zinc-400">[{format(startOfWk, "dd.MM")} —{" "}
              {format(addDays(startOfWk, 6), "dd.MM")}]</span>
            </span>
            <button
              onClick={handleNextWeek}
              className="text-zinc-400 hover:text-zinc-900 px-1 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-12 hide-scrollbar">
        {weekLogs.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            Нет данных за эту неделю
          </div>
        ) : null}

        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayLogs = weekLogs.filter((l) => l.date === dateStr);

          const dayPlanned = dayLogs.reduce(
            (acc, l) => acc + (l.minutes || 0),
            0,
          );
          const dayWorked = dayLogs.reduce(
            (acc, l) => acc + (l.workedMinutes || 0),
            0,
          );

          return (
            <div
              key={dateStr}
              className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="bg-zinc-50 border-b border-zinc-100 p-5 flex justify-between items-center group">
                <div className="font-bold text-zinc-900 capitalize tracking-tight">
                  {format(day, "EEEE", { locale: ru })}{" "}
                  <span className="text-zinc-400 font-medium ml-2 text-sm lowercase">
                    {dateStr}
                  </span>
                </div>
                <button
                  onClick={() => handleAddSession(day)}
                  className="text-zinc-500 hover:text-zinc-900 text-sm font-semibold flex items-center gap-1.5 transition-colors bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-sm opacity-0 group-hover:opacity-100"
                >
                  <Plus size={14} /> Добавить сеанс
                </button>
              </div>

              {dayLogs.length > 0 && (
                <div className="px-5 pt-4 pb-2">
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden w-full mb-2">
                    <div
                      className={`h-full rounded-full transition-all bg-zinc-900`}
                      style={{
                        width: `${Math.min(100, (dayWorked / 480) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <span>Таймлайн (Факт)</span>
                    <span>{formatMinutes(dayWorked)}</span>
                  </div>
                </div>
              )}

              {dayLogs.length > 0 && (
                <div className="divide-y divide-zinc-100/80 p-2">
                  {dayLogs.map((log) => {
                    const progress =
                      log.minutes > 0
                        ? Math.min(
                            100,
                            Math.round(
                              ((log.workedMinutes || 0) / log.minutes) * 100,
                            ),
                          )
                        : 0;
                    const isActive = activeTimer?.logId === log.id;

                    return (
                      <div
                        key={log.id}
                        className={cn("p-4 rounded-2xl transition-colors", isActive ? "bg-red-50/50 border border-red-100 shadow-sm" : "hover:bg-zinc-50/80")}
                      >
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-1/4">
                            <div className="font-semibold text-zinc-900">
                              {log.projectName || "Без проекта"}
                            </div>
                            <div className="text-sm text-zinc-500 mt-1 flex justify-between">
                              <span>
                                План: {formatMinutes(log.minutes || 0)}
                              </span>
                            </div>
                              <div className="text-sm flex items-center gap-1 mt-1">
                                {isActive ? (
                                  <>
                                    <span className="text-zinc-600 font-medium">Факт:</span>
                                    <LiveTimerDisplay startTime={activeTimer.startTime} initialMinutes={activeTimer.initialWorkedMinutes} />
                                    <span className="text-red-500 font-medium ml-1 text-xs flex items-center gap-1">
                                      ⏱ Идет отсчет...
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-zinc-600 font-medium">
                                    Факт: {formatMinutes(log.workedMinutes || 0)}
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-center gap-2">
                                <div className="text-xs font-bold text-zinc-400 w-8">
                                  {progress}%
                                </div>
                                <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-emerald-500" : "bg-zinc-900"}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 w-full space-y-3 pt-1">
                              <div className="text-zinc-800 break-words whitespace-pre-wrap font-medium">
                                {log.task || "Новая задача..."}
                              </div>
                              {log.result && (
                                <div className="text-sm text-zinc-500 break-words border-l-2 border-zinc-200 pl-3">
                                  {log.result}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mt-2">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-red-600 uppercase tracking-wide bg-red-100 border border-red-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                    В процессе
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border
                                 ${log.status === "Сделана" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : log.status === "В работе" ? "bg-zinc-100 text-zinc-900 border-zinc-300" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
                                  >
                                    {log.status || "Не начата"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-start md:self-center bg-white p-1 rounded-full shadow-sm border border-zinc-100">
                              {activeTimer?.logId === log.id ? (
                                <button
                                  onClick={() => stopTimer()}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Остановить таймер"
                                >
                                  <Square size={14} fill="currentColor" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => startTimer(log)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                                  title="Запустить таймер"
                                >
                                  <Play size={14} fill="currentColor" />
                                </button>
                              )}
                              <button
                                onClick={() => setEditingLogId(log.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                title="Редактировать"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteLog(log.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-zinc-50 border-t border-zinc-100 p-4 text-right text-sm text-zinc-500 font-medium">
                Итого за день: План{" "}
                <span className="font-bold text-zinc-900">
                  {formatMinutes(dayPlanned)}
                </span>{" "}
                / Факт{" "}
                <span className="font-bold text-zinc-900">
                  {formatMinutes(dayWorked)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {editingLogId && (
        <EditLogModal
          log={logs.find(l => l.id === editingLogId)}
          projects={projects}
          onSave={updateLog}
          onClose={() => setEditingLogId(null)}
        />
      )}

      {/* Footer Summary */}
      <div className="bg-zinc-900 text-white px-6 py-4 shrink-0 mt-4 max-w-5xl mx-auto w-full relative z-10 shadow-2xl rounded-3xl mx-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center text-sm font-medium">
          <div>
            <span className="text-zinc-400">Задач в плане: </span>
            <span className="font-bold ml-1 text-white">{weekLogs.length}</span>
            <span className="text-zinc-500 mx-4">|</span>
            <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Выполнено: </span>
            <span className="font-bold text-white ml-2 text-base">{weekLogs.filter(l => l.status === "Сделана").length}</span>
          </div>
          <div>
            <span className="text-zinc-400">План: </span>
            <span className="font-bold ml-1 text-white">{formatMinutes(weekLogs.reduce((acc, l) => acc + (l.minutes || 0), 0))}</span>
            <span className="text-zinc-500 mx-4">|</span>
            <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Факт: </span>
            <span className="font-bold text-white ml-2 text-base">{formatMinutes(weekLogs.reduce((acc, l) => acc + (l.workedMinutes || 0), 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
