/** Status das colunas do quadro Kanban */
export type TaskStatus = 'todo' | 'in-progress' | 'on-hold' | 'done';

/** Representa uma tarefa no quadro */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
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