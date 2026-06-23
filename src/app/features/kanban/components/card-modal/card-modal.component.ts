import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus, TaskUpdatePayload, TaskPriority, TASK_PRIORITY_LABELS, TASK_PRIORITY_ICONS, TASK_PRIORITY_COLORS, TASK_STATUS_ORDER, TASK_STATUS_LABELS } from '../../models/task.model';
import { TagComponent } from '../tag/tag.component';
import { SelectPopupComponent, SelectOption } from '../select-popup/select-popup.component';

@Component({
  selector: 'app-kanban-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TagComponent, SelectPopupComponent],
  templateUrl: './card-modal.component.html',
  styleUrl: './card-modal.component.css',
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
  protected editPriority: TaskPriority = 'normal';

  get priorityOptions(): SelectOption[] {
    return (Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map(key => ({
      value: key,
      label: TASK_PRIORITY_LABELS[key],
      icon: TASK_PRIORITY_ICONS[key],
      color: TASK_PRIORITY_COLORS[key],
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

  startEdit(): void {
    this.editTitle = this.task.title;
    this.editDescription = this.task.description ?? '';
    this.editPriority = this.task.priority;
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
      priority: this.editPriority,
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
