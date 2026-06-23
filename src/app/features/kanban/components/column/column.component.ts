import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus, TaskUpdatePayload, TaskPriority, SortMode } from '../../models/task.model';
import { KanbanCardComponent } from '../card/card.component';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, ScrollingModule, KanbanCardComponent],
  templateUrl: './column.component.html',
  styleUrl: './column.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) status!: TaskStatus;
  @Input({ required: true }) tasks!: Task[];
  @Input() sortMode: SortMode = 'manual';

  @Output() deleteTask = new EventEmitter<string>();
  @Output() moveForward = new EventEmitter<string>();
  @Output() moveBack = new EventEmitter<string>();
  @Output() updateTask = new EventEmitter<TaskUpdatePayload>();
  @Output() openDetails = new EventEmitter<string>();
  @Output() moveToStatus = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() updatePriority = new EventEmitter<{ id: string; priority: TaskPriority }>();
  @Output() updateStatus = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() dropped = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<SortMode>();

  readonly ITEM_SIZE = 148;

  get useVirtualScroll(): boolean {
    return this.tasks.length > 30;
  }

  trackTaskById(_index: number, task: Task): string {
    return task.id;
  }

  cycleSort(): void {
    const current = this.sortMode;
    if (current === 'manual') this.sortChange.emit('newest');
    else if (current === 'newest') this.sortChange.emit('oldest');
    else this.sortChange.emit('manual');
  }

  getSortIcon(): string {
    if (this.sortMode === 'newest') return 'bx-sort-down';
    if (this.sortMode === 'oldest') return 'bx-sort-up';
    return 'bx-sort-alt-2';
  }

  getSortLabel(): string {
    if (this.sortMode === 'newest') return 'Recentes';
    if (this.sortMode === 'oldest') return 'Antigos';
    return 'Manual';
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.dropped.emit();
  }
}
