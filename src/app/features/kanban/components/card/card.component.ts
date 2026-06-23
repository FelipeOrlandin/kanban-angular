import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Task,
  TASK_STATUS_ORDER,
  TaskUpdatePayload,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_LABELS,
} from '../../models/task.model';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { TagComponent } from '../tag/tag.component';
import { SelectPopupComponent, SelectOption } from '../select-popup/select-popup.component';

/**
 * Card individual de tarefa — componente puramente presentacional.
 * ChangeDetectionStrategy.OnPush: só reage se inputs mudarem.
 * Getters substituídos por computados e pipe truncate no template.
 * Modal de detalhes removido — agora é lazy-loaded via KanbanBoard.
 */
@Component({
  selector: 'app-kanban-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TruncatePipe, TagComponent, SelectPopupComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCardComponent {
  @Input({ required: true }) task!: Task;

  @Output() delete = new EventEmitter<string>();
  @Output() moveForward = new EventEmitter<string>();
  @Output() moveBack = new EventEmitter<string>();
  @Output() update = new EventEmitter<TaskUpdatePayload>();
  @Output() openDetails = new EventEmitter<string>();
  @Output() updatePriority = new EventEmitter<{ id: string; priority: TaskPriority }>();
  @Output() updateStatus = new EventEmitter<{ id: string; status: TaskStatus }>();

  protected isEditing = false;
  protected editTitle = '';
  protected editDescription = '';

  get canMoveForward(): boolean {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex < TASK_STATUS_ORDER.length - 1;
  }

  get canMoveBack(): boolean {
    const currentIndex = TASK_STATUS_ORDER.indexOf(this.task.status);
    return currentIndex > 0;
  }

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
    if (this.canMoveForward) {
      this.moveForward.emit(this.task.id);
    }
  }

  protected onMoveBack(): void {
    if (this.canMoveBack) {
      this.moveBack.emit(this.task.id);
    }
  }

  get priorityOptions(): SelectOption[] {
    return (Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map(key => ({
      value: key,
      label: TASK_PRIORITY_LABELS[key],
      icon: TASK_PRIORITY_ICONS[key],
      color: TASK_PRIORITY_COLORS[key],
    }));
  }

  get statusOptions(): SelectOption[] {
    return TASK_STATUS_ORDER.map(status => ({
      value: status,
      label: TASK_STATUS_LABELS[status],
      icon: 'bx-circle',
      color: this.getStatusColor(status),
    }));
  }

  getPriorityLabel(priority: TaskPriority): string {
    return TASK_PRIORITY_LABELS[priority];
  }

  getPriorityIcon(priority: TaskPriority): string {
    return TASK_PRIORITY_ICONS[priority];
  }

  getPriorityColor(priority: TaskPriority): string {
    return TASK_PRIORITY_COLORS[priority];
  }

  getStatusLabel(status: TaskStatus): string {
    return TASK_STATUS_LABELS[status];
  }

  getStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      'todo': '#f43f5e',
      'in-progress': '#f59e0b',
      'on-hold': '#8b5cf6',
      'done': '#22c55e',
    };
    return colors[status];
  }

  onPriorityChange(priority: string): void {
    this.updatePriority.emit({ id: this.task.id, priority: priority as TaskPriority });
  }

  onStatusChange(status: string): void {
    this.updateStatus.emit({ id: this.task.id, status: status as TaskStatus });
  }
}
