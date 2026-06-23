/** Status das colunas do quadro Kanban */
export type TaskStatus = 'todo' | 'in-progress' | 'on-hold' | 'done';

/** Prioridades das tarefas */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** Labels das prioridades */
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Urgente',
};

/** Ícones (emojis) das prioridades */
export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: 'bx-flag',
  normal: 'bx-diamond',
  high: 'bx-error',
  critical: 'bx-error-circle',
};

/** Cores das prioridades */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#94a3b8',
  normal: '#818cf8',
  high: '#f59e0b',
  critical: '#f43f5e',
};

/** Representa uma tarefa no quadro */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  createdAt: string;
}

/** Mapa de tarefas agrupadas por coluna */
export type TasksByColumn = Record<TaskStatus, Task[]>;

/** Ordem das colunas */
export const TASK_STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'on-hold', 'done'];

/** Labels exibidos nas colunas */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Novo',
  'in-progress': 'Em Andamento',
  'on-hold': 'Aguardando Resposta',
  done: 'Resolvido',
};

/** Ícones (emojis) dos status */
export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
  todo: 'bx-plus-circle',
  'in-progress': 'bx-loader-alt',
  'on-hold': 'bx-pause-circle',
  done: 'bx-check-circle',
};

/** Modos de ordenação na camada de visualização */
export type SortMode = 'manual' | 'newest' | 'oldest';

/** Payload para atualização de tarefa */
export interface TaskUpdatePayload {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
}

/** Campos de busca disponíveis */
export type SearchField = 'all' | 'title' | 'description';
