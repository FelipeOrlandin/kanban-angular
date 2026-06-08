import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { booleanAttribute, Component, EventEmitter, input, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus } from '../../models/task.model';
import { KanbanCardComponent, TaskUpdatePayload } from '../kanban-card/kanban-card.component';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, KanbanCardComponent],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.css',
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
  @Output() dropped = new EventEmitter<void>();

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
