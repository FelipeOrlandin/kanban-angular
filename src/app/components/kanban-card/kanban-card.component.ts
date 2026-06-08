import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TASK_STATUS_ORDER } from '../../models/task.model';

export interface TaskUpdatePayload {
  id: string;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-kanban-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kanban-card.component.html',
  styleUrl: './kanban-card.component.css',
})
export class KanbanCardComponent {
  @Input({ required: true }) task!: Task;

  @Output() delete = new EventEmitter<string>();
  @Output() moveForward = new EventEmitter<string>();
  @Output() moveBack = new EventEmitter<string>();
  @Output() update = new EventEmitter<TaskUpdatePayload>();

  isEditing = false;
  editTitle = '';
  editDescription = '';

  /** Descrição truncada para exibição no card */
  get shortDescription(): string {
    if (!this.task.description) {
      return '';
    }
    const max = 80;
    return this.task.description.length > max
      ? `${this.task.description.slice(0, max)}...`
      : this.task.description;
  }

  get canMoveForward(): boolean {
    const index = TASK_STATUS_ORDER.indexOf(this.task.status);
    return index < TASK_STATUS_ORDER.length - 1;
  }

  get canMoveBack(): boolean {
    const index = TASK_STATUS_ORDER.indexOf(this.task.status);
    return index > 0;
  }

  startEdit(): void {
    this.editTitle = this.task.title;
    this.editDescription = this.task.description ?? '';
    this.isEditing = true;
  }

  saveEdit(): void {
    if (!this.editTitle.trim()) {
      return;
    }
    this.update.emit({
      id: this.task.id,
      title: this.editTitle,
      description: this.editDescription,
    });
    this.isEditing = false;
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }

  onMoveForward(): void {
    if (this.canMoveForward) {
      this.moveForward.emit(this.task.id);
    }
  }

  onMoveBack(): void {
    if (this.canMoveBack) {
      this.moveBack.emit(this.task.id);
    }
  }
}
