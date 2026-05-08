import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { updateLog } from '../hooks/useTimeLogs';
import { formatMinutes } from '../utils/timeCalc';
import { toast } from 'sonner';
import { sendTelegramMessage } from '../services/telegramService';
import { useSettings } from '../hooks/useSettings';

interface ActiveTimer {
  logId: string;
  startTime: number;
  initialWorkedMinutes: number;
  plannedMinutes: number;
  projectName: string;
  task: string;
  notified?: boolean;
  notified5Min?: boolean;
  notifiedExpired?: boolean;
}

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  startTimer: (log: any) => void;
  stopTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType>({} as TimerContextType);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem('activeTimer');
    return saved ? JSON.parse(saved) : null;
  });

  const { settings } = useSettings();

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().catch(e => console.log('Notification permission request failed:', e));
    }
  }, []);

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('activeTimer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('activeTimer');
    }
  }, [activeTimer]);

  const playSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch (e) {}
  };

  const notifyBrowser = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch (e) {
        console.log('Browser notification failed:', e);
      }
    }
  };

  const notifyTelegram = async (message: string) => {
    if (settings?.tgToken && settings?.tgChatId) {
      await sendTelegramMessage(settings.tgToken, settings.tgChatId, message);
    }
  };

  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(async () => {
      const elapsedMs = Date.now() - activeTimer.startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const totalMinutes = activeTimer.initialWorkedMinutes + elapsedMinutes;
      const plannedMinutes = activeTimer.plannedMinutes || 0;

      const updates: Partial<ActiveTimer> = {};
      let shouldStop = false;

      if (elapsedSeconds > 0 && elapsedSeconds % (2 * 3600) === 0) {
        playSound();
        toast.info('Вы работаете?', { description: `Таймер работает уже ${Math.floor(elapsedSeconds / 3600)} часов без перерыва.` });
        notifyTelegram(`⏳ Вы работаете?\n\nТаймер по задаче "${activeTimer.task}" работает уже ${Math.floor(elapsedSeconds / 3600)} часов без перерыва.`);
      }

      if (elapsedSeconds >= 8 * 3600) {
        playSound();
        toast.error('Авто-стоп', { description: 'Таймер остановлен, так как работал более 8 часов.' });
        notifyTelegram(`🛑 Авто-стоп!\n\nТаймер по задаче "${activeTimer.task}" был автоматически остановлен (превышен лимит 8 часов).`);
        shouldStop = true;
      }

      if (!shouldStop && plannedMinutes > 0 && totalMinutes >= plannedMinutes + 30) {
        playSound();
        toast.error('Авто-стоп', { description: `Превышение плана на 30 минут. Таймер остановлен.` });
        notifyTelegram(`🛑 Авто-стоп!\n\nТаймер по задаче "${activeTimer.task}" остановлен. Фактическое время превысило план на 30 минут.`);
        shouldStop = true;
      }

      if (plannedMinutes > 0 && totalMinutes === plannedMinutes - 5 && !activeTimer.notified5Min) {
        notifyBrowser('Скоро время выйдет', `Осталось 5 минут на задачу "${activeTimer.task}"`);
        updates.notified5Min = true;
      }

      if (plannedMinutes > 0 && totalMinutes >= plannedMinutes && !activeTimer.notifiedExpired) {
        playSound();
        toast.warning('Время вышло!', { description: `Запланированное время (${plannedMinutes} мин) истекло.` });
        notifyBrowser('Время вышло!', `Запланированное время на задачу "${activeTimer.task}" истекло.`);
        updates.notifiedExpired = true;
      }

      if (shouldStop) {
        await stopTimer();
      } else if (Object.keys(updates).length > 0) {
        setActiveTimer(prev => prev ? { ...prev, ...updates } : null);
      }

    }, 5000);

    return () => clearInterval(interval);
  }, [activeTimer, settings]);

  const startTimer = (log: any) => {
    setActiveTimer({ 
      logId: log.id, 
      startTime: Date.now(), 
      initialWorkedMinutes: log.workedMinutes || 0, 
      plannedMinutes: log.minutes || 0,
      projectName: log.projectName || '', 
      task: log.task,
      notified: false
    });
    notifyTelegram(`▶️ Запущен таймер:\n\nПроект: ${log.projectName}\nЗадача: ${log.task}`);
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const elapsedMs = Date.now() - activeTimer.startTime;
    const elapsedMinutes = Math.round(elapsedMs / 60000);
    const newWorked = activeTimer.initialWorkedMinutes + elapsedMinutes;
    
    try {
      await updateLog(activeTimer.logId, { workedMinutes: newWorked, status: 'В работе' });
      notifyTelegram(`⏹ Таймер остановлен:\n\nПроект: ${activeTimer.projectName}\nЗадача: ${activeTimer.task}\nОтработано (итого): ${formatMinutes(newWorked)}`);
    } catch (e) {
      console.error("Failed to update log on timer stop", e);
    }
    
    setActiveTimer(null);
    localStorage.setItem('lastTimerStop', Date.now().toString());
  };

  return (
    <TimerContext.Provider value={{ activeTimer, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
