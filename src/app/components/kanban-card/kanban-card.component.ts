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

  protected isEditing = false;
  protected editTitle = '';
  protected editDescription = '';
  protected showModal = false;

  get shortTitle(): string {
    const title = this.task.title;
    if (!title) return '';
    const maxLength = 50;
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
  }

  get shortDescription(): string {
    const description = this.task.description;
    if (!description) return '';
    const maxLength = 80;
    return description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;
  }

  get canMoveForward(): boolean {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex < TASK_STATUS_ORDER.length - 1;
  }

  get canMoveBack(): boolean {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex > 0;
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
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
    if (this.canMoveForward) {
      this.moveForward.emit(this.task.id);
    }
  }

  protected onMoveBack(): void {
    if (this.canMoveBack) {
      this.moveBack.emit(this.task.id);
    }
  }
}