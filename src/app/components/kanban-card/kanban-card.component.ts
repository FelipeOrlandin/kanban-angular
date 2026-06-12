import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TASK_STATUS_ORDER } from '../../models/task.model';
import { TruncatePipe } from '../../pipes/truncate.pipe';

export interface TaskUpdatePayload {
  id: string;
  title: string;
  description?: string;
}

/**
 * Card individual de tarefa — componente puramente presentacional.
 * ChangeDetectionStrategy.OnPush: só reage se inputs mudarem.
 * Getters substituídos por computados e pipe truncate no template.
 * Modal de detalhes removido — agora é lazy-loaded via KanbanBoard.
 */
@Component({
  selector: 'app-kanban-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TruncatePipe],
  templateUrl: './kanban-card.component.html',
  styleUrl: './kanban-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCardComponent {
  @Input({ required: true }) task!: Task;

  @Output() delete = new EventEmitter<string>();
  @Output() moveForward = new EventEmitter<string>();
  @Output() moveBack = new EventEmitter<string>();
  @Output() update = new EventEmitter<TaskUpdatePayload>();
  @Output() openDetails = new EventEmitter<string>();

  protected isEditing = false;
  protected editTitle = '';
  protected editDescription = '';

  readonly canMoveForward = computed(() => {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex < TASK_STATUS_ORDER.length - 1;
  });

  readonly canMoveBack = computed(() => {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex > 0;
  });

  openDetailModal(): void {
    this.openDetails.emit(this.task.id);
  }

  startEdit(): void {
    this.editTitle = this.task.title;
    this.editDescription = this.task.description ?? '';
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveEdit(): void {
    const trimmedTitle = this.editTitle.trim();
    if (!trimmedTitle) return;

    this.update.emit({
      id: this.task.id,
      title: trimmedTitle,
      description: this.editDescription?.trim() || undefined,
    });

    this.isEditing = false;
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  protected onDelete(): void {
    this.delete.emit(this.task.id);
  }

  protected onMoveForward(): void {
    if (this.canMoveForward()) {
      this.moveForward.emit(this.task.id);
    }
  }

  protected onMoveBack(): void {
    if (this.canMoveBack()) {
      this.moveBack.emit(this.task.id);
    }
  }
}