import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { Task, TASK_STATUS_ORDER, TaskStatus, TasksByColumn } from '../models/task.model';

const STORAGE_KEY = 'kanban-tasks';

@Injectable({ providedIn: 'root' })
export class KanbanService {
  /** Signal contendo a lista plana de todas as tarefas */
  private readonly tasksSignal: WritableSignal<Task[]> = signal(this.loadFromStorage());

  /** Exposição read-only do estado */
  readonly tasks = this.tasksSignal.asReadonly();

  /** Tarefas agrupadas por coluna (computed — memoizado) */
  readonly tasksByColumn = computed<TasksByColumn>(() => {
    const tasks = this.tasksSignal();
    return this.toTasksByColumn(tasks);
  });

  // Persistência é feita diretamente em updateTasks()
  // Não usamos effect() aqui para evitar dependências circulares
  // e manter o salvamento sob controle explícito.

  getTasks(): Task[] {
    return this.tasksSignal();
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getTasks()
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);
  }

  /** Converte lista plana em arrays por coluna */
  toTasksByColumn(tasks: Task[]): TasksByColumn {
    const columns = this.emptyColumns();
    for (const status of TASK_STATUS_ORDER) {
      columns[status] = tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.order - b.order);
    }
    return columns;
  }

  /** Persiste estado após drag-drop (reordenação / troca de coluna) */
  syncFromColumns(columns: TasksByColumn): void {
    const allTasks: Task[] = [];
    for (const status of TASK_STATUS_ORDER) {
      columns[status].forEach((task, index) => {
        allTasks.push({ ...task, status, order: index });
      });
    }
    this.updateTasks(allTasks);
  }

  addTask(title: string, description?: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const todoTasks = this.getTasksByStatus('todo');
    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      description: description?.trim() || undefined,
      status: 'todo',
      order: todoTasks.length,
      createdAt: new Date().toISOString(),
    };

    this.updateTasks([...this.getTasks(), task]);
  }

  moveTask(taskId: string, newStatus: TaskStatus): void {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) {
      return;
    }

    const targetColumn = this.getTasksByStatus(newStatus);
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: newStatus, order: targetColumn.length }
        : t
    );
    this.updateTasks(this.normalizeTasks(updated));
  }

  updateTask(taskId: string, title: string, description?: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const tasks = this.getTasks().map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: trimmedTitle,
            description: description?.trim() || undefined,
          }
        : task
    );
    this.updateTasks(tasks);
  }

  deleteTask(taskId: string): void {
    this.updateTasks(this.normalizeTasks(this.getTasks().filter((task) => task.id !== taskId)));
  }

  private emptyColumns(): TasksByColumn {
    return { todo: [], 'in-progress': [], 'on-hold': [], done: [] };
  }

  /** Garante order sequencial (0, 1, 2...) em cada coluna */
  private normalizeTasks(tasks: Task[]): Task[] {
    const result: Task[] = [];
    for (const status of TASK_STATUS_ORDER) {
      const columnTasks = tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.order - b.order);
      columnTasks.forEach((task, index) => {
        result.push({ ...task, order: index });
      });
    }
    return result;
  }

  /** Atualiza signal + localStorage em uma única operação síncrona */
  private updateTasks(tasks: Task[]): void {
    this.tasksSignal.set(tasks);
    this.saveToStorage(tasks);
  }

  private loadFromStorage(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as Partial<Task>[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      const withDefaults = parsed.map((task, index) => ({
        id: task.id ?? crypto.randomUUID(),
        title: task.title ?? 'Sem título',
        description: task.description,
        status: (task.status ?? 'todo') as TaskStatus,
        order: task.order ?? index,
        createdAt: task.createdAt ?? new Date().toISOString(),
      }));
      return this.normalizeTasks(withDefaults);
    } catch {
      return [];
    }
  }

  private saveToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // localStorage cheio ou indisponível — ignora silenciosamente
    }
  }
}