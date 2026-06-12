import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus } from '../../models/task.model';
import { TaskUpdatePayload } from '../kanban-card/kanban-card.component';

/**
 * Modal de detalhes do card — carregado via lazy loading (loadComponent).
 * ChangeDetectionStrategy.OnPush: só reage se inputs mudarem.
 */
@Component({
  selector: 'app-kanban-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kanban-card-modal.component.html',
  styleUrl: './kanban-card-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCardModalComponent {
  @Input({ required: true }) task!: Task;
  @Input() statuses: { status: TaskStatus; title: string }[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<TaskUpdatePayload>();
  @Output() moveToStatus = new EventEmitter<{ id: string; status: TaskStatus }>();

  protected isEditing = false;
  protected editTitle = '';
  protected editDescription = '';

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

  protected onOverlayClick(): void {
    this.close.emit();
  }

  protected onContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}