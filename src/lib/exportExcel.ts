import * as XLSX from 'xlsx';
import { Project } from '../types';

export function exportProjectToExcel(project: Project) {
  const wb = XLSX.utils.book_new();

  // 1. Overview
  const overviewData = [
    ['Параметр', 'Значение'],
    ['Название', project.name],
    ['Домен', project.domain],
    ['Ниша', project.niche],
    ['Регион', project.region],
    ['Бюджет', project.budget],
    ['KPI', project.kpi],
    ['Статус', project.status],
    ['Стадия', project.stage],
    ['Фокус', project.focus],
    ['Узкое место', project.bottleneck],
    ['Следующий шаг', project.nextStep],
    ['Последнее обновление', project.lastUpdated],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Обзор');

  // 2. Current Work
  const tasksData = project.tasks.map(t => ({
    'Название': t.name,
    'Слой': t.layer,
    'Приоритет': t.priority,
    'Ответственный': t.assignee,
    'Статус': t.status,
    'Дата добавления': t.startDate,
    'Срок': t.deadline || '',
    'Фактическая дата': t.factDate || '',
    'Что проверить': t.whatToCheck,
    'Следующая проверка': t.nextCheckDate || '',
    'Ссылка на ТЗ': t.docLink || '',
  }));
  const wsTasks = XLSX.utils.json_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Текущая работа');

  // 3. Queue
  const queueData = project.queue.map(q => ({
    'Название': q.name,
    'Дата добавления': q.addedDate,
    'Источник': q.source,
    'Слой': q.layer,
    'Импакт': q.impact,
    'Срочность': q.urgency,
    'Зависимость': q.dependency,
    'Подтверждение данными': q.dataConfirmation,
    'Трудозатраты': q.effort,
    'Приоритет (скор)': q.priority,
    'Решение': q.decision,
    'Статус': q.status,
    'Когда брать': q.whenToTake,
    'Комментарий': q.comment || '',
  }));
  const wsQueue = XLSX.utils.json_to_sheet(queueData);
  XLSX.utils.book_append_sheet(wb, wsQueue, 'Очередь');

  // 4. Log
  const logData = project.log.map(l => ({
    'Дата': l.date,
    'Что было сделано': l.whatWasDone,
    'Зачем': l.why,
    'Что проверить': l.whatToCheck,
    'Статус эффекта': l.effectStatus,
    'Ссылка на ТЗ': l.docLink || '',
    'Отчет': l.reportString,
    'Следующая проверка': l.nextCheckDate || '',
    'Комментарий': l.comment || '',
  }));
  const wsLog = XLSX.utils.json_to_sheet(logData);
  XLSX.utils.book_append_sheet(wb, wsLog, 'Журнал');

  // 5. Completed
  const completedData = project.completed.map(c => ({
    'Дата': c.date,
    'Название': c.name,
    'Слой': c.layer,
    'Приоритет': c.priority,
    'Ответственный': c.assignee,
    'Результат': c.result,
    'Что проверить': c.whatToCheck || '',
    'Ссылка на ТЗ': c.docLink || '',
    'Комментарий': c.comment || '',
  }));
  const wsCompleted = XLSX.utils.json_to_sheet(completedData);
  XLSX.utils.book_append_sheet(wb, wsCompleted, 'Завершённое');

  // 6. Daily Log (Micro-actions)
  if (project.dailyLog && project.dailyLog.length > 0) {
    const dailyLogData = project.dailyLog.map(d => ({
      'Дата': d.date,
      'Категория': d.category,
      'Что сделано': d.description,
      'URL (Страницы)': d.url || '',
      'Затрачено времени': d.timeSpent || '',
    }));
    const wsDailyLog = XLSX.utils.json_to_sheet(dailyLogData);
    XLSX.utils.book_append_sheet(wb, wsDailyLog, 'Дневник (Микрозадачи)');
  }

  // Export
  XLSX.writeFile(wb, `${project.name}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
