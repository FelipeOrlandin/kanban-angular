import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Task } from '../../models/task.model';
import { KanbanCardComponent } from '../kanban-card/kanban-card.component';
import { KanbanColumnComponent } from './kanban-column.component';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Minha tarefa',
    description: 'Descrição da tarefa',
    status: 'todo',
    order: 0,
    createdAt: '2024-06-01T10:00:00.000Z',
    ...overrides,
  };
}

function createDropEvent(
  previousData: Task[],
  containerData: Task[],
  previousIndex: number,
  currentIndex: number,
  sameContainer = false
): CdkDragDrop<Task[]> {
  const container = { data: containerData };
  return {
    previousContainer: sameContainer ? container : { data: previousData },
    container,
    previousIndex,
    currentIndex,
  } as CdkDragDrop<Task[]>;
}

describe('KanbanColumnComponent', () => {
  let component: KanbanColumnComponent;
  let fixture: ComponentFixture<KanbanColumnComponent>;

  const tasks: Task[] = [
    createTask({ id: '1', title: 'Task A' }),
    createTask({ id: '2', title: 'Task B', order: 1 }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanColumnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanColumnComponent);
    component = fixture.componentInstance;
    component.title = 'To Do';
    component.status = 'todo';
    component.tasks = tasks;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe tasks via @Input', () => {
    expect(fixture.nativeElement.querySelector('.kanban-column__title').textContent).toContain('To Do');
    expect(fixture.nativeElement.querySelector('.kanban-column__count').textContent).toBe('2');

    const cards = fixture.debugElement.queryAll(By.directive(KanbanCardComponent));
    expect(cards.length).toBe(2);
    expect(cards[0].componentInstance.task.title).toBe('Task A');
    expect(cards[1].componentInstance.task.title).toBe('Task B');
  });

  it('emite dropped ao soltar card na mesma coluna', () => {
    const droppedSpy = spyOn(component.dropped, 'emit');
    const columnTasks = [...tasks];

    component.onDrop(createDropEvent(columnTasks, columnTasks, 0, 1, true));

    expect(droppedSpy).toHaveBeenCalled();
    expect(columnTasks.map((t) => t.id)).toEqual(['2', '1']);
  });

  it('emite dropped ao soltar card entre colunas', () => {
    const droppedSpy = spyOn(component.dropped, 'emit');
    const todoTasks = [createTask({ id: 'move-1', title: 'Mover' })];
    const inProgressTasks: Task[] = [];

    component.onDrop(createDropEvent(todoTasks, inProgressTasks, 0, 0));

    expect(droppedSpy).toHaveBeenCalled();
    expect(todoTasks.length).toBe(0);
    expect(inProgressTasks.length).toBe(1);
    expect(inProgressTasks[0].id).toBe('move-1');
  });

  it('não emite dropped quando dragDisabled está ativo', () => {
    fixture.componentRef.setInput('dragDisabled', true);
    fixture.detectChanges();

    const droppedSpy = spyOn(component.dropped, 'emit');
    const columnTasks = [...tasks];

    component.onDrop(createDropEvent(columnTasks, columnTasks, 0, 1, true));

    expect(droppedSpy).not.toHaveBeenCalled();
    expect(columnTasks.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('dragDisabled bind funciona', () => {
    fixture.componentRef.setInput('dragDisabled', true);
    fixture.detectChanges();

    expect(component.dragDisabled()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.kanban-column__drag-handle')).toBeNull();

    fixture.componentRef.setInput('dragDisabled', false);
    fixture.detectChanges();

    expect(component.dragDisabled()).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.kanban-column__drag-handle').length).toBe(2);
  });
});
