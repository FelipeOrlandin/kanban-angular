import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskPriority, TASK_PRIORITY_LABELS, TASK_PRIORITY_ICONS, TASK_PRIORITY_COLORS } from '../../models/task.model';
import { SelectOption } from '../select-popup/select-popup.component';

@Component({
  selector: 'app-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-modal.component.html',
  styleUrl: './create-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<{ title: string; description?: string; priority: TaskPriority }>();

  title = '';
  description = '';
  priority: TaskPriority = 'normal';

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

  onSubmit(): void {
    const trimmedTitle = this.title.trim();
    if (!trimmedTitle) return;

    this.create.emit({
      title: trimmedTitle,
      description: this.description.trim() || undefined,
      priority: this.priority,
    });
  }

  onOverlayClick(): void {
    this.close.emit();
  }

  onContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    }
  }
}
