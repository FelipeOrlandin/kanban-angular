import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) color!: string;
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() clickable = false;

  @Output() clicked = new EventEmitter<void>();

  readonly isEmoji = computed(() => !this.icon.startsWith('bx'));

  onClick(): void {
    if (this.clickable) {
      this.clicked.emit();
    }
  }
}
