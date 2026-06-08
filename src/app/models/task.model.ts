/** Status das colunas do quadro Kanban */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/** Representa uma tarefa no quadro */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number; // posição dentro da coluna (drag and drop)
  createdAt: string; // ISO string para serialização no localStorage
}

/** Mapa de tarefas agrupadas por coluna (usado pelo CDK drag-drop) */
export type TasksByColumn = Record<TaskStatus, Task[]>;

/** Ordem das colunas para navegação avançar/recuar */
export const TASK_STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];

/** Labels exibidos nas colunas */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

/** Modos de ordenação na camada de visualização */
export type SortMode = 'manual' | 'newest' | 'oldest';
