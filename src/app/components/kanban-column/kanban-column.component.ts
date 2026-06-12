import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus } from '../../models/task.model';
import { KanbanCardComponent, TaskUpdatePayload } from '../kanban-card/kanban-card.component';

/**
 * Coluna do Kanban com suporte a virtual scrolling (cdk-virtual-scroll-viewport)
 * para listas acima de 30 cards, e ChangeDetectionStrategy.OnPush.
 */
@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, ScrollingModule, KanbanCardComponent],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) status!: TaskStatus;
  @Input({ required: true }) tasks!: Task[];

  /** Desabilita drag quando filtro/ordenação estão ativos */
  dragDisabled = input(false, { alias: 'dragDisabled', transform: booleanAttribute });

  @Output() deleteTask = new EventEmitter<string>();
  @Output() moveForward = new EventEmitter<string>();
  @Output() moveBack = new EventEmitter<string>();
  @Output() updateTask = new EventEmitter<TaskUpdatePayload>();
  @Output() openDetails = new EventEmitter<string>();
  @Output() moveToStatus = new EventEmitter<{ id: string; status: TaskStatus }>();
  @Output() dropped = new EventEmitter<void>();

  /** Altura do item virtual (em px) — aproximadamente a altura do card + gap */
  readonly ITEM_SIZE = 140;

  /** Ativa virtual scrolling apenas se houver mais de 30 cards */
  readonly useVirtualScroll = computed(() => this.tasks.length > 30);

  /** trackBy para *cdkVirtualFor e *ngFor */
  trackTaskById(_index: number, task: Task): string {
    return task.id;
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (this.dragDisabled()) {
      return;
    }
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