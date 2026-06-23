import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Task } from '../../models/task.model';
import { KanbanCardComponent } from '../card/card.component';
import { KanbanColumnComponent } from './column.component';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Minha tarefa',
    description: 'Descrição da tarefa',
    status: 'todo',
    priority: 'normal',
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
    createTask({ id: '1', title: 'Task A', order: 0 }),
    createTask({ id: '2', title: 'Task B', order: 1 }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanColumnComponent, DragDropModule],
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

  describe('exibição', () => {
    it('exibe título e contador de tarefas', () => {
      const title = fixture.debugElement.query(By.css('.kanban-column__title'));
      const count = fixture.debugElement.query(By.css('.kanban-column__count'));
      expect(title.nativeElement.textContent).toContain('To Do');
      expect(count.nativeElement.textContent).toBe('2');
    });

    it('exibe cards para cada tarefa', () => {
      const cards = fixture.debugElement.queryAll(By.directive(KanbanCardComponent));
      expect(cards.length).toBe(2);
      expect(cards[0].componentInstance.task.title).toBe('Task A');
      expect(cards[1].componentInstance.task.title).toBe('Task B');
    });

    it('aplica classe CSS correta baseada no status', () => {
      let column = fixture.debugElement.query(By.css('.kanban-column'));
      expect(column.classes['kanban-column--todo']).toBeTrue();

      fixture.componentRef.setInput('status', 'in-progress');
      fixture.detectChanges();
      column = fixture.debugElement.query(By.css('.kanban-column'));
      expect(column.classes['kanban-column--in-progress']).toBeTrue();

      fixture.componentRef.setInput('status', 'done');
      fixture.detectChanges();
      column = fixture.debugElement.query(By.css('.kanban-column'));
      expect(column.classes['kanban-column--done']).toBeTrue();
    });

    it('exibe mensagem "Nenhuma tarefa" quando tasks está vazio', () => {
      fixture.componentRef.setInput('tasks', []);
      fixture.detectChanges();
      const emptyMsg = fixture.debugElement.query(By.css('.kanban-column__empty'));
      expect(emptyMsg).toBeTruthy();
      expect(emptyMsg.nativeElement.textContent).toContain('Nenhuma tarefa');
    });
  });

  describe('sort button', () => {
    it('exibe botão de sort no header', () => {
      const sortBtn = fixture.debugElement.query(By.css('.kanban-column__sort-btn'));
      expect(sortBtn).toBeTruthy();
    });

    it('emite sortChange ao clicar no botão de sort', () => {
      const sortSpy = spyOn(component.sortChange, 'emit');
      const sortBtn = fixture.debugElement.query(By.css('.kanban-column__sort-btn'));
      sortBtn.triggerEventHandler('click', null);
      expect(sortSpy).toHaveBeenCalledWith('newest');
    });

    it('alterna entre manual -> newest -> oldest -> manual', () => {
      const sortSpy = spyOn(component.sortChange, 'emit');
      const sortBtn = fixture.debugElement.query(By.css('.kanban-column__sort-btn'));

      component.sortMode = 'manual';
      sortBtn.triggerEventHandler('click', null);
      expect(sortSpy).toHaveBeenCalledWith('newest');

      component.sortMode = 'newest';
      sortBtn.triggerEventHandler('click', null);
      expect(sortSpy).toHaveBeenCalledWith('oldest');

      component.sortMode = 'oldest';
      sortBtn.triggerEventHandler('click', null);
      expect(sortSpy).toHaveBeenCalledWith('manual');
    });
  });

  describe('eventos de cards', () => {
    it('emite deleteTask quando card emite delete', () => {
      const deleteSpy = spyOn(component.deleteTask, 'emit');
      const card = fixture.debugElement.query(By.directive(KanbanCardComponent));
      card.componentInstance.delete.emit('1');
      expect(deleteSpy).toHaveBeenCalledWith('1');
    });

    it('emite moveForward quando card emite moveForward', () => {
      const moveSpy = spyOn(component.moveForward, 'emit');
      const card = fixture.debugElement.query(By.directive(KanbanCardComponent));
      card.componentInstance.moveForward.emit('1');
      expect(moveSpy).toHaveBeenCalledWith('1');
    });

    it('emite moveBack quando card emite moveBack', () => {
      const moveSpy = spyOn(component.moveBack, 'emit');
      const card = fixture.debugElement.query(By.directive(KanbanCardComponent));
      card.componentInstance.moveBack.emit('1');
      expect(moveSpy).toHaveBeenCalledWith('1');
    });

    it('emite updateTask quando card emite update', () => {
      const updateSpy = spyOn(component.updateTask, 'emit');
      const payload = { id: '1', title: 'Novo', description: 'Desc' };
      const card = fixture.debugElement.query(By.directive(KanbanCardComponent));
      card.componentInstance.update.emit(payload);
      expect(updateSpy).toHaveBeenCalledWith(payload);
    });
  });

  describe('drag and drop (cdk)', () => {
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
  });

  describe('cdkDropList configuration', () => {
    it('possui cdkDropList com id baseado no status', () => {
      let dropList = fixture.debugElement.query(By.css('[cdkDropList]'));
      expect(dropList.attributes['id']).toBe('todo');

      fixture.componentRef.setInput('status', 'in-progress');
      fixture.detectChanges();
      dropList = fixture.debugElement.query(By.css('[cdkDropList]'));
      expect(dropList.attributes['id']).toBe('in-progress');
    });
  });
});
