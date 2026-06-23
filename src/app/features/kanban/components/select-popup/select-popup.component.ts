import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  OnDestroy,
  ElementRef,
  ViewContainerRef,
  TemplateRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

export interface SelectOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-select-popup',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './select-popup.component.html',
  styleUrl: './select-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPopupComponent implements OnDestroy, AfterViewInit {
  @Input() options: SelectOption[] = [];
  @Input() currentValue = '';
  @Input() position: 'top' | 'bottom' = 'bottom';

  @Output() selected = new EventEmitter<string>();

  readonly isOpen = signal(false);

  @ViewChild('dropdownTemplate', { static: true }) dropdownTemplate!: TemplateRef<unknown>;

  private overlayRef: OverlayRef | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.closeOverlay();
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.isOpen()) return;
    this.isOpen.set(true);
    this.showOverlay();
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.closeOverlay();
  }

  select(value: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selected.emit(value);
    this.close();
  }

  isEmoji(icon: string): boolean {
    return !icon.startsWith('bx');
  }

  private showOverlay(): void {
    this.closeOverlay();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'start',
          originY: this.position === 'top' ? 'top' : 'bottom',
          overlayX: 'start',
          overlayY: this.position === 'top' ? 'bottom' : 'top',
          offsetY: this.position === 'top' ? -8 : 8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.close(),
      panelClass: 'select-popup-overlay',
    });

    const portal = new TemplatePortal(this.dropdownTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => {
      this.close();
    });
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
