import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { Task, TasksByColumn } from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { KanbanBoardComponent } from './kanban-board.component';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Tarefa teste',
    status: 'todo',
    order: 0,
    createdAt: '2024-06-01T10:00:00.000Z',
    ...overrides,
  };
}

function toTasksByColumn(tasks: Task[]): TasksByColumn {
  return {
    todo: tasks.filter((t) => t.status === 'todo').sort((a, b) => a.order - b.order),
    'in-progress': tasks
      .filter((t) => t.status === 'in-progress')
      .sort((a, b) => a.order - b.order),
    done: tasks.filter((t) => t.status === 'done').sort((a, b) => a.order - b.order),
  };
}

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let kanbanService: jasmine.SpyObj<KanbanService>;
  let tasksSubject: BehaviorSubject<Task[]>;

  const mockTasks: Task[] = [
    createTask({
      id: '1',
      title: 'Alpha task',
      description: 'primeira descricao',
      status: 'todo',
      order: 0,
      createdAt: '2024-01-01T10:00:00.000Z',
    }),
    createTask({
      id: '2',
      title: 'Beta task',
      description: 'beta keyword',
      status: 'todo',
      order: 1,
      createdAt: '2024-06-01T10:00:00.000Z',
    }),
    createTask({
      id: '3',
      title: 'Gamma done',
      status: 'done',
      order: 0,
      createdAt: '2024-03-01T10:00:00.000Z',
    }),
  ];

  beforeEach(async () => {
    tasksSubject = new BehaviorSubject<Task[]>([]);

    kanbanService = jasmine.createSpyObj<KanbanService>(
      'KanbanService',
      ['addTask', 'deleteTask', 'updateTask', 'moveTask', 'syncFromColumns', 'toTasksByColumn'],
      { tasks$: tasksSubject.asObservable() }
    );
    kanbanService.toTasksByColumn.and.callFake(toTasksByColumn);

    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
      providers: [{ provide: KanbanService, useValue: kanbanService }],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
  });

  function loadTasks(tasks: Task[]): void {
    tasksSubject.next(tasks);
    fixture.detectChanges();
  }

  function getColumnComponents(): KanbanColumnComponent[] {
    return fixture.debugElement
      .queryAll(By.directive(KanbanColumnComponent))
      .map((de) => de.componentInstance as KanbanColumnComponent);
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve adicionar tarefa ao submeter formulário', () => {
    fixture.detectChanges();

    component.newTitle = 'Nova tarefa';
    component.newDescription = 'Descrição nova';
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(kanbanService.addTask).toHaveBeenCalledWith('Nova tarefa', 'Descrição nova');
    expect(component.newTitle).toBe('');
    expect(component.newDescription).toBe('');
  });

  it('deve chamar deleteTask ao receber evento do card', () => {
    loadTasks(mockTasks);

    component.onDeleteTask('2');

    expect(kanbanService.deleteTask).toHaveBeenCalledWith('2');
  });

  describe('filtro (searchText)', () => {
    beforeEach(() => loadTasks(mockTasks));

    it('filtra por título (case insensitive)', () => {
      component.searchText = 'ALPHA';
      expect(component.filteredAndSortedTasksByColumn.todo.map((t) => t.id)).toEqual(['1']);
    });

    it('filtra por descrição (case insensitive)', () => {
      component.searchText = 'KEYWORD';
      expect(component.filteredAndSortedTasksByColumn.todo.map((t) => t.id)).toEqual(['2']);
    });

    it('retorna tasksByColumn original sem filtro e ordenação manual', () => {
      component.searchText = '';
      component.sortMode = 'manual';
      expect(component.filteredAndSortedTasksByColumn.todo).toBe(component.tasksByColumn.todo);
    });
  });

  describe('ordenação por createdAt', () => {
    beforeEach(() => loadTasks(mockTasks));

    it('ordena por mais recentes', () => {
      component.sortMode = 'newest';
      const todoIds = component.filteredAndSortedTasksByColumn.todo.map((t) => t.id);
      expect(todoIds).toEqual(['2', '1']);
    });

    it('ordena por mais antigos', () => {
      component.sortMode = 'oldest';
      const todoIds = component.filteredAndSortedTasksByColumn.todo.map((t) => t.id);
      expect(todoIds).toEqual(['1', '2']);
    });
  });

  describe('drag desabilitado', () => {
    beforeEach(() => loadTasks(mockTasks));

    it('quando filtro ativo', () => {
      component.searchText = 'alpha';
      fixture.detectChanges();

      expect(component.isDragEnabled).toBeFalse();
      getColumnComponents().forEach((col) => {
        expect(col.dragDisabled()).toBeTrue();
      });
    });

    it('quando ordenação não é manual', () => {
      component.searchText = '';
      component.sortMode = 'newest';
      fixture.detectChanges();

      expect(component.isDragEnabled).toBeFalse();
      getColumnComponents().forEach((col) => {
        expect(col.dragDisabled()).toBeTrue();
      });
    });

    it('habilitado sem filtro e com ordenação manual', () => {
      component.searchText = '';
      component.sortMode = 'manual';
      fixture.detectChanges();

      expect(component.isDragEnabled).toBeTrue();
      getColumnComponents().forEach((col) => {
        expect(col.dragDisabled()).toBeFalse();
      });
    });
  });

  describe('drag entre colunas', () => {
    it('chama syncFromColumns ao soltar card entre colunas (move de coluna)', () => {
      loadTasks([
        createTask({ id: 'drag-1', title: 'Arrastar', status: 'todo', order: 0 }),
      ]);

      const columns = getColumnComponents();
      const inProgressColumn = columns[1];
      const todoTasks = component.tasksByColumn.todo;
      const inProgressTasks = component.tasksByColumn['in-progress'];

      inProgressColumn.onDrop({
        previousContainer: { data: todoTasks },
        container: { data: inProgressTasks },
        previousIndex: 0,
        currentIndex: 0,
      } as CdkDragDrop<Task[]>);

      component.onColumnDrop();

      expect(kanbanService.syncFromColumns).toHaveBeenCalledWith(component.tasksByColumn);
      expect(component.tasksByColumn.todo.length).toBe(0);
      expect(component.tasksByColumn['in-progress'].length).toBe(1);
      expect(component.tasksByColumn['in-progress'][0].id).toBe('drag-1');
    });
  });
});
