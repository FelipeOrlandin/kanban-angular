import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SortMode,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  Task,
  TaskStatus,
  TasksByColumn,
  TaskUpdatePayload,
  SearchField,
  TaskPriority,
} from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';
import { KanbanColumnComponent } from '../column/column.component';
import { KanbanCardModalComponent } from '../card-modal/card-modal.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, KanbanColumnComponent, KanbanCardModalComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent implements OnInit {
  private readonly kanbanService = inject(KanbanService);
  private readonly ngZone = inject(NgZone);

  readonly columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    title: TASK_STATUS_LABELS[status],
  }));

  readonly sortOptions: { value: SortMode; label: string }[] = [
    { value: 'manual', label: 'Manual' },
    { value: 'newest', label: 'Mais recentes' },
    { value: 'oldest', label: 'Mais antigos' },
  ];

  readonly searchFields: { value: SearchField; label: string }[] = [
    { value: 'all', label: 'Tudo' },
    { value: 'title', label: 'Título' },
    { value: 'description', label: 'Descrição' },
  ];

  /** Signals */
  readonly newTitle = signal('');
  readonly newDescription = signal('');
  readonly searchText = signal('');
  readonly searchField = signal<SearchField>('all');
  readonly sortMode = signal<SortMode>('manual');
  readonly isDarkMode = signal(false);

  /** Modal state */
  protected selectedTaskId = signal<string | null>(null);

  /** Tasks do service */
  private readonly tasksByColumn = this.kanbanService.tasksByColumn;

  /** Drag só quando não há filtro */
  readonly isDragEnabled = computed(() => {
    return !this.searchText().trim() && this.sortMode() === 'manual';
  });

  readonly hasActiveFilters = computed(() => {
    return !!this.searchText().trim() || this.sortMode() !== 'manual';
  });

  readonly totalTaskCount = computed(() => {
    const columns = this.tasksByColumn();
    return TASK_STATUS_ORDER.reduce((sum, status) => sum + columns[status].length, 0);
  });

  /** Filtragem + ordenação premium */
  readonly filteredAndSortedTasksByColumn = computed<TasksByColumn>(() => {
    const columns = this.tasksByColumn();
    if (this.isDragEnabled()) {
      return columns;
    }

    const query = this.searchText().trim().toLowerCase();
    const field = this.searchField();
    const result: TasksByColumn = { todo: [], 'in-progress': [], 'on-hold': [], done: [] };
    const sort = this.sortMode();

    for (const status of TASK_STATUS_ORDER) {
      let tasks = [...columns[status]];

      // Filtro por campo específico
      if (query) {
        tasks = tasks.filter((task) => {
          if (field === 'title') {
            return task.title.toLowerCase().includes(query);
          }
          if (field === 'description') {
            return task.description?.toLowerCase().includes(query) ?? false;
          }
          // 'all'
          return (
            task.title.toLowerCase().includes(query) ||
            (task.description?.toLowerCase().includes(query) ?? false)
          );
        });
      }

      // Ordenação por data
      if (sort === 'newest') {
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'oldest') {
        tasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        tasks.sort((a, b) => a.order - b.order);
      }

      result[status] = tasks;
    }

    return result;
  });

  readonly visibleTaskCount = computed(() => {
    if (this.isDragEnabled()) return this.totalTaskCount();
    const filtered = this.filteredAndSortedTasksByColumn();
    return TASK_STATUS_ORDER.reduce((sum, status) => sum + filtered[status].length, 0);
  });

  /** TrackBy */
  trackByColumnStatus(_index: number, column: { status: TaskStatus }): TaskStatus {
    return column.status;
  }
  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
  trackBySortOption(_index: number, option: { value: SortMode }): SortMode {
    return option.value;
  }
  trackBySearchField(_index: number, option: { value: SearchField }): SearchField {
    return option.value;
  }

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const savedTheme = localStorage.getItem('kanban-theme');
      if (savedTheme === 'light') {
        this.ngZone.run(() => this.isDarkMode.set(false));
        document.body.classList.add('light-mode');
      } else {
        this.ngZone.run(() => this.isDarkMode.set(true));
      }
    });
  }

  /** Alterna ordenação: manual → newest → oldest → manual */
  cycleSort(): void {
    const current = this.sortMode();
    if (current === 'manual') this.sortMode.set('newest');
    else if (current === 'newest') this.sortMode.set('oldest');
    else this.sortMode.set('manual');
  }

  /** Obtém label para o botão de ordenação */
  getSortLabel(sort: SortMode): string {
    const map: Record<SortMode, string> = {
      manual: 'Manual',
      newest: 'Recentes',
      oldest: 'Antigos',
    };
    return map[sort];
  }

  onColumnDrop(): void {
    this.kanbanService.syncFromColumns(this.kanbanService.tasksByColumn());
  }

  onAddTask(): void {
    const title = this.newTitle();
    if (!title.trim()) return;
    this.kanbanService.addTask(title, this.newDescription());
    this.newTitle.set('');
    this.newDescription.set('');
  }

  onDeleteTask(taskId: string): void {
    this.kanbanService.deleteTask(taskId);
  }

  onUpdateTask(payload: TaskUpdatePayload): void {
    this.kanbanService.updateTask(payload.id, payload.title, payload.description);
    this.selectedTaskId.set(null);
  }

  onUpdatePriority(event: { id: string; priority: TaskPriority }): void {
    this.kanbanService.updateTaskPriority(event.id, event.priority);
  }

  onUpdateStatus(event: { id: string; status: TaskStatus }): void {
    this.kanbanService.moveTask(event.id, event.status);
  }

  /** Move task diretamente para um status */
  onMoveToStatus(taskId: string, status: TaskStatus): void {
    this.kanbanService.moveTask(taskId, status);
    this.selectedTaskId.set(null);
  }

  /** Wrapper para modal emit moveToStatus com objeto { id, status } */
  protected onModalMoveToStatus($event: { id: string; status: TaskStatus }): void {
    this.onMoveToStatus($event.id, $event.status);
  }

  protected onModalUpdate($event: TaskUpdatePayload): void {
    this.onUpdateTask($event);
  }

  onMoveForward(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) return;
    const index = TASK_STATUS_ORDER.indexOf(task.status);
    if (index < TASK_STATUS_ORDER.length - 1) {
      this.kanbanService.moveTask(taskId, TASK_STATUS_ORDER[index + 1]);
    }
  }

  onMoveBack(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) return;
    const index = TASK_STATUS_ORDER.indexOf(task.status);
    if (index > 0) {
      this.kanbanService.moveTask(taskId, TASK_STATUS_ORDER[index - 1]);
    }
  }

  async onOpenDetails(taskId: string): Promise<void> {
    this.selectedTaskId.set(taskId);
  }

  closeModal(): void {
    this.selectedTaskId.set(null);
  }

  get selectedTask(): Task | null {
    const id = this.selectedTaskId();
    if (!id) return null;
    const columns = this.tasksByColumn();
    for (const status of TASK_STATUS_ORDER) {
      const found = columns[status].find((t) => t.id === id);
      if (found) return found;
    }
    return null;
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    if (next) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('kanban-theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('kanban-theme', 'light');
    }
  }

  private findTask(taskId: string): Task | undefined {
    const columns = this.tasksByColumn();
    for (const status of TASK_STATUS_ORDER) {
      const found = columns[status].find((t) => t.id === taskId);
      if (found) return found;
    }
    return undefined;
  }
}
