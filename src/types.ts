export type ProjectStatus = 'Красный' | 'Жёлтый' | 'Зелёный';
export type ProjectStage = 'Диагностика' | 'Стабилизация' | 'Индексация' | 'Структура' | 'On-page' | 'CTR и сниппет' | 'Поддержка';
export type TaskLayer = 'Техничка' | 'Индексация' | 'Структура' | 'On-page' | 'CTR' | 'Качество' | 'Поддержка';
export type TaskPriority = 'A' | 'B' | 'C' | 'D';
export type TaskStatus = 'Сделать сейчас' | 'В работе' | 'Ждёт клиента' | 'Ждёт разработчика' | 'Ждёт индексации' | 'Ждёт накопления данных' | 'Проверка результата' | 'Сделано' | 'Отменено';
export type QueueDecision = 'Брать в текущую работу' | 'Оставить в очереди' | 'Отложить' | 'Отменить';
export type QueueStatus = 'Новая' | 'В очереди' | 'Запланирована' | 'Заморожена' | 'Закрыта';
export type EffectStatus = 'Сделано' | 'Ожидается переобход' | 'Ожидается индексация' | 'Ожидается накопление данных' | 'Проверить повторно' | 'Требуется доработка';
export type CompletedResult = 'Выполнено' | 'Частично выполнено' | 'Закрыто без внедрения' | 'Отменено' | 'Передано клиенту' | 'Передано разработчику';

export interface Project {
  id: string;
  name: string;
  domain: string;
  niche: string;
  region: string;
  budget: string;
  kpi: string;
  status: ProjectStatus;
  stage: ProjectStage;
  focus: string;
  bottleneck: string;
  nextStep: string;
  lastUpdated: string;
  tasks: Task[];
  queue: QueueItem[];
  log: LogItem[];
  completed: CompletedItem[];
}

export interface Task {
  id: string;
  name: string;
  layer: TaskLayer;
  priority: TaskPriority;
  assignee: string;
  status: TaskStatus;
  startDate: string;
  deadline?: string;
  factDate?: string;
  whatToCheck: string;
  nextCheckDate?: string;
  reportString?: string;
}

export interface QueueItem {
  id: string;
  addedDate: string;
  source: string;
  name: string;
  layer: TaskLayer;
  impact: number; // 0-2
  urgency: number; // 0-2
  dependency: number; // 0-2
  dataConfirmation: number; // 0-2
  effort: number; // 0-2
  priority: number; // calculated
  decision: QueueDecision;
  status: QueueStatus;
  whenToTake: string;
  comment?: string;
}

export interface LogItem {
  id: string;
  date: string;
  whatWasDone: string;
  why: string;
  whatToCheck: string;
  effectStatus: EffectStatus;
  reportString: string;
  nextCheckDate?: string;
  comment?: string;
}

export interface CompletedItem {
  id: string;
  date: string;
  name: string;
  layer: TaskLayer;
  priority: TaskPriority;
  assignee: string;
  result: CompletedResult;
  whatToCheck?: string;
  comment?: string;
}
