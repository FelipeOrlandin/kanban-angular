/** Status das colunas do quadro Kanban */
export type TaskStatus = 'todo' | 'in-progress' | 'on-hold' | 'done';

/** Prioridades das tarefas */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** Labels das prioridades */
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Importante',
  critical: 'Crítico',
};

/** Ícones Boxicons das prioridades */
export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: 'bx-flag',
  normal: 'bx-flag-checkered',
  high: 'bx-error',
  critical: 'bx-error-circle',
};

/** Cores das prioridades */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  normal: '#6366f1',
  high: '#f59e0b',
  critical: '#ef4444',
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
  todo: 'To Do',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  done: 'Done',
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
