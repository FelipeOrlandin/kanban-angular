# Kanban Enhancement Plan - Prioridades, Tags e Melhorias de UX

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task.

**Goal:** Implementar prioridades nas tarefas, tags clicáveis para status/prioridade com popups, melhorar drag-and-drop e substituir emojis por Boxicons.

**Architecture:** Modificar models para incluir `TaskPriority`, criar componente de popup para seleção, atualizar card para exibir tags, melhorar drag-drop para funcionar em qualquer parte do card.

**Tech Stack:** Angular 19+, Angular CDK (drag-drop), Boxicons, Signals

---

## Task 1: Atualizar Model com Prioridade

**Files:**
- Modify: `src/app/features/kanban/models/task.model.ts`

- [ ] **Step 1: Adicionar tipo TaskPriority e constantes**

```typescript
/** Prioridades das tarefas */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/** Labels das prioridades */
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Importante',
  critical: 'Crítico',
};

/** Ícones Boxicons das prioridades */
export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: 'bx-flag',
  normal: 'bx-flag-checkered',
  high: 'bx-error',
  critical: 'bx-error-circle',
};

/** Cores das prioridades */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  normal: '#6366f1',
  high: '#f59e0b',
  critical: '#ef4444',
};
```

- [ ] **Step 2: Atualizar interface Task para incluir priority**

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;  // NOVO
  order: number;
  createdAt: string;
}
```

- [ ] **Step 3: Atualizar TaskUpdatePayload para incluir priority**

```typescript
export interface TaskUpdatePayload {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;  // NOVO
}
```

---

## Task 2: Atualizar KanbanService

**Files:**
- Modify: `src/app/features/kanban/services/kanban.service.ts`

- [ ] **Step 1: Adicionar método updateTaskPriority**

```typescript
updateTaskPriority(taskId: string, priority: TaskPriority): void {
  const tasks = this.getTasks().map((task) =>
    task.id === taskId ? { ...task, priority } : task
  );
  this.updateTasks(tasks);
}
```

- [ ] **Step 2: Atualizar addTask para incluir priority default**

```typescript
addTask(title: string, description?: string, priority: TaskPriority = 'normal'): void {
  // ...existing code...
  const task: Task = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    description: description?.trim() || undefined,
    status: 'todo',
    priority,  // NOVO
    order: todoTasks.length,
    createdAt: new Date().toISOString(),
  };
  // ...
}
```

- [ ] **Step 3: Atualizar loadFromStorage para incluir priority default**

```typescript
const withDefaults = parsed.map((task, index) => ({
  id: task.id ?? crypto.randomUUID(),
  title: task.title ?? 'Sem título',
  description: task.description,
  status: (task.status ?? 'todo') as TaskStatus,
  priority: (task.priority ?? 'normal') as TaskPriority,  // NOVO
  order: task.order ?? index,
  createdAt: task.createdAt ?? new Date().toISOString(),
}));
```

---

## Task 3: Criar Componente TagGenérico

**Files:**
- Create: `src/app/features/kanban/components/tag/tag.component.ts`
- Create: `src/app/features/kanban/components/tag/tag.component.html`
- Create: `src/app/features/kanban/components/tag/tag.component.css`

- [ ] **Step 1: Criar tag.component.ts**

```typescript
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

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

  onClick(): void {
    if (this.clickable) {
      this.clicked.emit();
    }
  }
}
```

- [ ] **Step 2: Criar tag.component.html**

```html
<span
  class="tag"
  [class.tag--sm]="size === 'sm'"
  [class.tag--md]="size === 'md'"
  [class.tag--clickable]="clickable"
  [style.--tag-color]="color"
  (click)="onClick()"
  [attr.tabindex]="clickable ? 0 : null"
  [attr.role]="clickable ? 'button' : null"
>
  <i class="bx" [ngClass]="icon"></i>
  <span class="tag__label">{{ label }}</span>
</span>
```

- [ ] **Step 3: Criar tag.component.css**

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--tag-color);
  background: color-mix(in srgb, var(--tag-color) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--tag-color) 30%, transparent);
  transition: all var(--transition);
  white-space: nowrap;
}

.tag--sm {
  padding: 2px 6px;
  font-size: 0.625rem;
}

.tag--md {
  padding: 4px 10px;
  font-size: 0.75rem;
}

.tag--clickable {
  cursor: pointer;
}

.tag--clickable:hover {
  background: color-mix(in srgb, var(--tag-color) 25%, transparent);
  transform: translateY(-1px);
}

.tag--clickable:focus {
  outline: 2px solid var(--tag-color);
  outline-offset: 2px;
}

.tag i {
  font-size: 0.875em;
}

.tag__label {
  line-height: 1;
}
```

---

## Task 4: Criar Componente Popup de Seleção

**Files:**
- Create: `src/app/features/kanban/components/select-popup/select-popup.component.ts`
- Create: `src/app/features/kanban/components/select-popup/select-popup.component.html`
- Create: `src/app/features/kanban/components/select-popup/select-popup.component.css`

- [ ] **Step 1: Criar select-popup.component.ts**

```typescript
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, HostListener } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-select-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-popup.component.html',
  styleUrl: './select-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPopupComponent {
  @Input() options: SelectOption[] = [];
  @Input() currentValue = '';
  @Input() position: 'top' | 'bottom' = 'bottom';

  @Output() selected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  readonly isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.select-popup') && !target.closest('.tag--clickable')) {
      this.close();
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  select(value: string): void {
    this.selected.emit(value);
    this.close();
  }

  getOptionClass(option: SelectOption): string {
    return option.value === this.currentValue ? 'select-popup__option--active' : '';
  }
}
```

- [ ] **Step 2: Criar select-popup.component.html**

```html
<div class="select-popup" [class.select-popup--open]="isOpen()">
  <ng-content></ng-content>
  
  @if (isOpen()) {
    <div class="select-popup__dropdown" [class.select-popup__dropdown--top]="position === 'top'">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="select-popup__option"
          [class]="getOptionClass(option)"
          [style.--option-color]="option.color"
          (click)="select(option.value); $event.stopPropagation()"
        >
          <i class="bx" [ngClass]="option.icon"></i>
          <span>{{ option.label }}</span>
          @if (option.value === currentValue) {
            <i class='bx bx-check select-popup__check'></i>
          }
        </button>
      }
    </div>
  }
</div>
```

- [ ] **Step 3: Criar select-popup.component.css**

```css
.select-popup {
  position: relative;
  display: inline-block;
}

.select-popup__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 160px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: fadeIn 0.15s ease;
  overflow: hidden;
}

.select-popup__dropdown--top {
  top: auto;
  bottom: calc(100% + 4px);
}

.select-popup__option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition);
  text-align: left;
}

.select-popup__option:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.select-popup__option--active {
  background: color-mix(in srgb, var(--option-color) 15%, transparent);
  color: var(--option-color);
}

.select-popup__option i:first-child {
  font-size: 1rem;
  color: var(--option-color);
}

.select-popup__check {
  margin-left: auto;
  color: var(--color-accent);
}
```

---

## Task 5: Atualizar Card Component com Tags

**Files:**
- Modify: `src/app/features/kanban/components/card/card.component.ts`
- Modify: `src/app/features/kanban/components/card/card.component.html`
- Modify: `src/app/features/kanban/components/card/card.component.css`

- [ ] **Step 1: Atualizar card.component.ts**

Adicionar imports e outputs para prioridade e status:

```typescript
import { Task, TASK_STATUS_ORDER, TaskUpdatePayload, TaskPriority, TASK_PRIORITY_LABELS, TASK_PRIORITY_ICONS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS } from '../../models/task.model';
import { TagComponent } from '../tag/tag.component';
import { SelectPopupComponent, SelectOption } from '../select-popup/select-popup.component';

// Adicionar outputs:
@Output() updatePriority = new EventEmitter<{ id: string; priority: TaskPriority }>();
@Output() updateStatus = new EventEmitter<{ id: string; status: TaskStatus }>();

// Adicionar getters:
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

private getStatusColor(status: TaskStatus): string {
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
```

- [ ] **Step 2: Atualizar card.component.html**

Adicionar tags no header do card:

```html
<header class="kanban-card__header">
  <div class="kanban-card__tags">
    <app-select-popup
      [options]="priorityOptions"
      [currentValue]="task.priority"
      (selected)="onPriorityChange($event)"
    >
      <app-tag
        [label]="getPriorityLabel(task.priority)"
        [icon]="getPriorityIcon(task.priority)"
        [color]="getPriorityColor(task.priority)"
        [clickable]="true"
        (clicked)=""
      ></app-tag>
    </app-select-popup>
    
    <app-select-popup
      [options]="statusOptions"
      [currentValue]="task.status"
      (selected)="onStatusChange($event)"
    >
      <app-tag
        [label]="getStatusLabel(task.status)"
        [icon]="'bx-circle'"
        [color]="getStatusColor(task.status)"
        [clickable]="true"
        (clicked)=""
      ></app-tag>
    </app-select-popup>
  </div>
  
  <div class="kanban-card__header-actions" (click)="$event.stopPropagation()">
    <!-- ...existing buttons... -->
  </div>
</header>
```

- [ ] **Step 3: Adicionar estilos para tags no card.component.css**

```css
.kanban-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
```

---

## Task 6: Melhorar Drag-and-Drop

**Files:**
- Modify: `src/app/features/kanban/components/column/column.component.html`
- Modify: `src/app/features/kanban/components/column/column.component.css`

- [ ] **Step 1: Remover drag handle e aplicar cdkDrag no card inteiro**

Na coluna, remover o `<button>` do drag handle e aplicar `cdkDrag` diretamente no wrapper do card:

```html
<div class="kanban-column__drag-item" cdkDrag [cdkDragDisabled]="dragDisabled()">
  <app-kanban-card
    class="kanban-column__card"
    [task]="task"
    (delete)="deleteTask.emit($event)"
    (moveForward)="moveForward.emit($event)"
    (moveBack)="moveBack.emit($event)"
    (update)="updateTask.emit($event)"
    (openDetails)="openDetails.emit($event)"
    (updatePriority)="updatePriority.emit($event)"
    (updateStatus)="updateStatus.emit($event)"
  />
</div>
```

- [ ] **Step 2: Atualizar estilos para drag**

```css
.kanban-column__drag-item {
  cursor: grab;
}

.kanban-column__drag-item:active {
  cursor: grabbing;
}

/* Estilo quando arrastando */
.cdk-drag-preview {
  opacity: 0.9;
  transform: rotate(2deg);
}
```

---

## Task 7: Atualizar Board Component

**Files:**
- Modify: `src/app/features/kanban/components/board/board.component.ts`
- Modify: `src/app/features/kanban/components/board/board.component.html`

- [ ] **Step 1: Adicionar métodos para atualizar prioridade e status**

```typescript
onUpdatePriority(event: { id: string; priority: TaskPriority }): void {
  this.kanbanService.updateTaskPriority(event.id, event.priority);
}

onUpdateStatus(event: { id: string; status: TaskStatus }): void {
  this.kanbanService.moveTask(event.id, event.status);
}
```

- [ ] **Step 2: Passar outputs para column component**

```html
<app-kanban-column
  [title]="column.title"
  [status]="column.status"
  [tasks]="filteredAndSortedTasksByColumn()[column.status]"
  [dragDisabled]="!isDragEnabled()"
  (deleteTask)="onDeleteTask($event)"
  (moveForward)="onMoveForward($event)"
  (moveBack)="onMoveBack($event)"
  (updateTask)="onUpdateTask($event)"
  (openDetails)="onOpenDetails($event)"
  (updatePriority)="onUpdatePriority($event)"
  (updateStatus)="onUpdateStatus($event)"
  (dropped)="onColumnDrop()"
/>
```

---

## Task 8: Atualizar Column Component Outputs

**Files:**
- Modify: `src/app/features/kanban/components/column/column.component.ts`
- Modify: `src/app/features/kanban/components/column/column.component.html`

- [ ] **Step 1: Adicionar outputs para priority e status**

```typescript
@Output() updatePriority = new EventEmitter<{ id: string; priority: TaskPriority }>();
@Output() updateStatus = new EventEmitter<{ id: string; status: TaskStatus }>();
```

- [ ] **Step 2: Passar outputs para card component**

```html
<app-kanban-card
  class="kanban-column__card"
  [task]="task"
  (delete)="deleteTask.emit($event)"
  (moveForward)="moveForward.emit($event)"
  (moveBack)="moveBack.emit($event)"
  (update)="updateTask.emit($event)"
  (openDetails)="openDetails.emit($event)"
  (updatePriority)="updatePriority.emit($event)"
  (updateStatus)="updateStatus.emit($event)"
/>
```

---

## Task 9: Atualizar Ícones de Ordenação

**Files:**
- Modify: `src/app/features/kanban/components/board/board.component.html`

- [ ] **Step 1: Substituir emojis por Boxicons**

No template do board, localizar o botão de ordenação e substituir:

```html
<button
  class="sort-toggle"
  (click)="cycleSort()"
  type="button"
  [class.sort-toggle--active]="sortMode() !== 'manual'"
>
  @if (sortMode() === 'manual') {
    <i class='bx bx-sort-alt-2'></i>
  } @else if (sortMode() === 'newest') {
    <i class='bx bx-sort-down'></i>
  } @else {
    <i class='bx bx-sort-up'></i>
  }
  {{ getSortLabel(sortMode()) }}
</button>
```

---

## Task 10: Atualizar Testes

**Files:**
- Modify: `src/app/features/kanban/services/kanban.service.spec.ts`
- Modify: `src/app/features/kanban/components/card/card.component.spec.ts`

- [ ] **Step 1: Atualizar testes do service para incluir priority**

Adicionar testes para `updateTaskPriority` e atualizar mocks para incluir `priority`.

- [ ] **Step 2: Atualizar testes do card para tags**

Adicionar testes para os novos outputs `updatePriority` e `updateStatus`.

---

## Task 11: Validação Final

- [ ] **Step 1: Rodar build**

```bash
npx ng build
```

Esperado: Build completo sem erros.

- [ ] **Step 2: Rodar testes**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Esperado: Todos os testes passando.

- [ ] **Step 3: Verificar funcionalidade manualmente**

- Abrir aplicação
- Criar tarefa
- Verificar tags de prioridade e status no card
- Clicar na tag de prioridade e alterar
- Clicar na tag de status e alterar
- Arrastar card por qualquer parte
- Verificar ordenação com ícones Boxicons
