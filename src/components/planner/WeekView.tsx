import React, { useState, useEffect } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useTimeLogs } from "../../hooks/useTimeLogs";
import { useSettings } from "../../hooks/useSettings";
import { useTimer } from "../../context/TimerContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { formatMinutes } from "../../utils/timeCalc";
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
          ((Number(p.budget) || 0) / hourlyRate) *
            60 *
            (Number(String(p.overhead).replace(',', '.')) || 1),
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
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Неделя</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleClearDrafts}
          >
            Очистить черновики
          </Button>
          <Button
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
            onClick={handleSmartPlan}
            disabled={isPlanning}
          >
            <Wand2 size={16} />
            {isPlanning ? "Планируем..." : "Умный план"}
          </Button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-md">
            <button
              onClick={handlePrevWeek}
              className="text-slate-500 hover:text-slate-900 px-1"
            >
              ←
            </button>
            <span className="text-sm font-medium text-slate-700">
              Неделя: [{format(startOfWk, "dd.MM")} —{" "}
              {format(addDays(startOfWk, 6), "dd.MM")}]
            </span>
            <button
              onClick={handleNextWeek}
              className="text-slate-500 hover:text-slate-900 px-1"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {weekLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
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
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center group">
                <div className="font-semibold text-slate-800 capitalize">
                  {format(day, "EEEE", { locale: ru })}{" "}
                  <span className="text-slate-400 font-normal ml-2 text-sm lowercase">
                    {dateStr}
                  </span>
                </div>
                <button
                  onClick={() => handleAddSession(day)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={14} /> Добавить сеанс
                </button>
              </div>

              {dayLogs.length > 0 && (
                <div className="px-4 pt-4 pb-2">
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden w-full mb-2">
                    <div
                      className={`h-full rounded-full transition-all bg-blue-500`}
                      style={{
                        width: `${Math.min(100, (dayWorked / 480) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Таймлайн (Факт)</span>
                    <span>{formatMinutes(dayWorked)}</span>
                  </div>
                </div>
              )}

              {dayLogs.length > 0 && (
                <div className="divide-y divide-slate-100">
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
                        className={isActive ? "p-4 bg-red-50/50 border border-red-200 rounded-md my-1" : "p-4 hover:bg-slate-50/50"}
                      >
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-1/4">
                            <div className="font-medium text-slate-900">
                              {log.projectName || "Без проекта"}
                            </div>
                            <div className="text-sm text-slate-500 mt-1 flex justify-between">
                              <span>
                                План: {formatMinutes(log.minutes || 0)}
                              </span>
                            </div>
                              <div className="text-sm flex items-center gap-1 mt-1">
                                {isActive ? (
                                  <>
                                    <span className="text-blue-600 font-medium">Факт:</span>
                                    <LiveTimerDisplay startTime={activeTimer.startTime} initialMinutes={activeTimer.initialWorkedMinutes} />
                                    <span className="text-red-600 font-medium ml-1 text-xs flex items-center gap-1">
                                      ⏱ Идет отсчет...
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-blue-600 font-medium">
                                    Факт: {formatMinutes(log.workedMinutes || 0)}
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <div className="text-xs text-slate-500 w-8">
                                  {progress}%
                                </div>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 w-full space-y-3">
                              <div className="text-slate-800 break-words whitespace-pre-wrap">
                                {log.task || "Новая задача..."}
                              </div>
                              {log.result && (
                                <div className="text-sm text-slate-500 break-words border-l-2 border-slate-200 pl-3">
                                  {log.result}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-red-600 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                    В процессе
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium cursor-default
                                 ${log.status === "Сделана" ? "bg-emerald-100 text-emerald-700" : log.status === "В работе" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                                  >
                                    {log.status || "Не начата"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {activeTimer?.logId === log.id ? (
                                <button
                                  onClick={() => stopTimer()}
                                  className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                                  title="Остановить таймер"
                                >
                                  <Square size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => startTimer(log)}
                                  className="p-2 text-green-600 hover:text-green-700 transition-colors"
                                  title="Запустить таймер"
                                >
                                  <Play size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => setEditingLogId(log.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Редактировать"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => deleteLog(log.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-slate-50 border-t border-slate-200 p-3 text-right text-sm text-slate-600">
                Итого за день: План{" "}
                <span className="font-medium text-slate-800">
                  {formatMinutes(dayPlanned)}
                </span>{" "}
                / Факт{" "}
                <span className="font-medium text-slate-800">
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
    </div>
  );
}
