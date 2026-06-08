import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  SortMode,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  Task,
  TaskStatus,
  TasksByColumn,
} from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';
import { TaskUpdatePayload } from '../kanban-card/kanban-card.component';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, KanbanColumnComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.css',
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  readonly columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    title: TASK_STATUS_LABELS[status],
  }));

  readonly sortOptions: { value: SortMode; label: string }[] = [
    { value: 'manual', label: 'Ordem manual (drag)' },
    { value: 'newest', label: 'Mais recentes' },
    { value: 'oldest', label: 'Mais antigos' },
  ];

  /** Arrays mutáveis por coluna — referência estável para o CDK */
  tasksByColumn: TasksByColumn = { todo: [], 'in-progress': [], done: [] };

  newTitle = '';
  newDescription = '';
  searchText = '';
  sortMode: SortMode = 'manual';

  private subscription?: Subscription;

  constructor(private readonly kanbanService: KanbanService) {}

  ngOnInit(): void {
    this.subscription = this.kanbanService.tasks$.subscribe((tasks) => {
      this.syncTasksByColumn(tasks);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** Drag só quando não há filtro ativo e ordenação é manual */
  get isDragEnabled(): boolean {
    return !this.searchText.trim() && this.sortMode === 'manual';
  }

  get totalTaskCount(): number {
    return TASK_STATUS_ORDER.reduce((sum, status) => sum + this.tasksByColumn[status].length, 0);
  }

  get visibleTaskCount(): number {
    if (this.isDragEnabled) {
      return this.totalTaskCount;
    }
    return TASK_STATUS_ORDER.reduce(
      (sum, status) => sum + this.filteredAndSortedTasksByColumn[status].length,
      0
    );
  }

  /**
   * Camada de visualização: filtra e ordena sem alterar tasksByColumn.
   * Retorna o original quando filtro vazio + ordenação manual.
   */
  get filteredAndSortedTasksByColumn(): TasksByColumn {
    if (this.isDragEnabled) {
      return this.tasksByColumn;
    }

    const query = this.searchText.trim().toLowerCase();
    const result: TasksByColumn = { todo: [], 'in-progress': [], done: [] };

    for (const status of TASK_STATUS_ORDER) {
      let tasks = [...this.tasksByColumn[status]];

      if (query) {
        tasks = tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            (task.description?.toLowerCase().includes(query) ?? false)
        );
      }

      if (this.sortMode === 'newest') {
        tasks.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (this.sortMode === 'oldest') {
        tasks.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        tasks.sort((a, b) => a.order - b.order);
      }

      result[status] = tasks;
    }

    return result;
  }

  private syncTasksByColumn(tasks: Task[]): void {
    const incoming = this.kanbanService.toTasksByColumn(tasks);
    for (const status of TASK_STATUS_ORDER) {
      this.tasksByColumn[status].length = 0;
      this.tasksByColumn[status].push(...incoming[status]);
    }
  }

  onColumnDrop(): void {
    this.kanbanService.syncFromColumns(this.tasksByColumn);
  }

  onAddTask(): void {
    if (!this.newTitle.trim()) {
      return;
    }
    this.kanbanService.addTask(this.newTitle, this.newDescription);
    this.newTitle = '';
    this.newDescription = '';
  }

  onDeleteTask(taskId: string): void {
    this.kanbanService.deleteTask(taskId);
  }

  onUpdateTask(payload: TaskUpdatePayload): void {
    this.kanbanService.updateTask(payload.id, payload.title, payload.description);
  }

  onMoveForward(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) {
      return;
    }
    const index = TASK_STATUS_ORDER.indexOf(task.status);
    if (index < TASK_STATUS_ORDER.length - 1) {
      this.kanbanService.moveTask(taskId, TASK_STATUS_ORDER[index + 1]);
    }
  }

  onMoveBack(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) {
      return;
    }
    const index = TASK_STATUS_ORDER.indexOf(task.status);
    if (index > 0) {
      this.kanbanService.moveTask(taskId, TASK_STATUS_ORDER[index - 1]);
    }
  }

  private findTask(taskId: string): Task | undefined {
    for (const status of TASK_STATUS_ORDER) {
      const found = this.tasksByColumn[status].find((t) => t.id === taskId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}
