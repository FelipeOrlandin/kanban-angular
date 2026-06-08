import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanBoardComponent } from './kanban-board.component';
import { KanbanService } from '../../services/kanban.service';
import { Task } from '../../models/task.model';
import { BehaviorSubject } from 'rxjs';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let mockKanbanService: jasmine.SpyObj<KanbanService>;
  let tasksSubject: BehaviorSubject<Task[]>;

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      order: 0,
      createdAt: '2024-06-01T10:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'in-progress',
      order: 0,
      createdAt: '2024-06-02T10:00:00.000Z',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      order: 0,
      createdAt: '2024-06-03T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    tasksSubject = new BehaviorSubject<Task[]>(mockTasks);
    mockKanbanService = jasmine.createSpyObj('KanbanService', [
      'addTask',
      'deleteTask',
      'updateTask',
      'moveTask',
      'syncFromColumns',
      'toTasksByColumn',
    ]);

    // Mock the tasks$ observable
    Object.defineProperty(mockKanbanService, 'tasks$', {
      get: () => tasksSubject.asObservable(),
    });

    mockKanbanService.toTasksByColumn.and.returnValue({
      todo: [mockTasks[0]],
      'in-progress': [mockTasks[1]],
      done: [mockTasks[2]],
    });

    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
      providers: [{ provide: KanbanService, useValue: mockKanbanService }],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
    localStorage.clear();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to kanbanService.tasks$', () => {
      expect(component.tasksByColumn['todo'].length).toBe(1);
      expect(component.tasksByColumn['in-progress'].length).toBe(1);
      expect(component.tasksByColumn['done'].length).toBe(1);
    });

    it('should load dark mode from localStorage', () => {
      localStorage.setItem('kanban-theme', 'dark');
      const newComponent = new KanbanBoardComponent(mockKanbanService);
      newComponent.ngOnInit();
      expect(newComponent.isDarkMode).toBeTrue();
    });

    it('should not load dark mode if localStorage is light', () => {
      localStorage.setItem('kanban-theme', 'light');
      const newComponent = new KanbanBoardComponent(mockKanbanService);
      newComponent.ngOnInit();
      expect(newComponent.isDarkMode).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['subscription'];
      spyOn(subscription!, 'unsubscribe');
      component.ngOnDestroy();
      expect(subscription!.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('isDragEnabled', () => {
    it('should return true when search is empty and sort is manual', () => {
      component.searchText = '';
      component.sortMode = 'manual';
      expect(component.isDragEnabled).toBeTrue();
    });

    it('should return false when search has text', () => {
      component.searchText = 'search text';
      component.sortMode = 'manual';
      expect(component.isDragEnabled).toBeFalse();
    });

    it('should return false when sort mode is not manual', () => {
      component.searchText = '';
      component.sortMode = 'newest';
      expect(component.isDragEnabled).toBeFalse();
    });
  });

  describe('totalTaskCount', () => {
    it('should return total count of all tasks', () => {
      expect(component.totalTaskCount).toBe(3);
    });

    it('should return 0 when no tasks', () => {
      component.tasksByColumn = { todo: [], 'in-progress': [], done: [] };
      expect(component.totalTaskCount).toBe(0);
    });
  });

  describe('visibleTaskCount', () => {
    it('should return total count when drag is enabled', () => {
      component.searchText = '';
      component.sortMode = 'manual';
      expect(component.visibleTaskCount).toBe(3);
    });

    it('should return filtered count when search is active', () => {
      component.searchText = 'Task 1';
      component.sortMode = 'manual';
      expect(component.visibleTaskCount).toBe(1);
    });
  });

  describe('filteredAndSortedTasksByColumn', () => {
    beforeEach(() => {
      component.tasksByColumn = {
        todo: [
          { ...mockTasks[0], createdAt: '2024-06-01T10:00:00.000Z' },
          { ...mockTasks[0], id: 'task-4', title: 'Other', createdAt: '2024-06-05T10:00:00.000Z' },
        ],
        'in-progress': [mockTasks[1]],
        done: [mockTasks[2]],
      };
    });

    it('should return original when search is empty and sort is manual', () => {
      component.searchText = '';
      component.sortMode = 'manual';
      const result = component.filteredAndSortedTasksByColumn;
      expect(result).toBe(component.tasksByColumn);
    });

    it('should filter by title', () => {
      component.searchText = 'Task 1';
      component.sortMode = 'manual';
      const result = component.filteredAndSortedTasksByColumn;
      expect(result.todo.length).toBe(1);
      expect(result.todo[0].id).toBe('task-1');
    });

    it('should filter by description', () => {
      component.searchText = 'Description 2';
      component.sortMode = 'manual';
      const result = component.filteredAndSortedTasksByColumn;
      expect(result['in-progress'].length).toBe(1);
      expect(result['in-progress'][0].id).toBe('task-2');
    });

    it('should sort by newest', () => {
      component.searchText = '';
      component.sortMode = 'newest';
      const result = component.filteredAndSortedTasksByColumn;
      expect(result.todo[0].createdAt).toBe('2024-06-05T10:00:00.000Z');
      expect(result.todo[1].createdAt).toBe('2024-06-01T10:00:00.000Z');
    });

    it('should sort by oldest', () => {
      component.searchText = '';
      component.sortMode = 'oldest';
      const result = component.filteredAndSortedTasksByColumn;
      expect(result.todo[0].createdAt).toBe('2024-06-01T10:00:00.000Z');
      expect(result.todo[1].createdAt).toBe('2024-06-05T10:00:00.000Z');
    });
  });

  describe('onColumnDrop', () => {
    it('should call kanbanService.syncFromColumns', () => {
      component.onColumnDrop();
      expect(mockKanbanService.syncFromColumns).toHaveBeenCalledWith(component.tasksByColumn);
    });
  });

  describe('onAddTask', () => {
    it('should call kanbanService.addTask with title and description', () => {
      component.newTitle = 'New Task';
      component.newDescription = 'New Description';
      component.onAddTask();
      expect(mockKanbanService.addTask).toHaveBeenCalledWith('New Task', 'New Description');
    });

    it('should clear newTitle and newDescription after adding', () => {
      component.newTitle = 'New Task';
      component.newDescription = 'New Description';
      component.onAddTask();
      expect(component.newTitle).toBe('');
      expect(component.newDescription).toBe('');
    });

    it('should not add task if title is empty', () => {
      component.newTitle = '   ';
      component.newDescription = 'Description';
      component.onAddTask();
      expect(mockKanbanService.addTask).not.toHaveBeenCalled();
    });
  });

  describe('onDeleteTask', () => {
    it('should call kanbanService.deleteTask with task id', () => {
      component.onDeleteTask('task-1');
      expect(mockKanbanService.deleteTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('onUpdateTask', () => {
    it('should call kanbanService.updateTask with payload', () => {
      const payload = { id: 'task-1', title: 'Updated', description: 'Updated Desc' };
      component.onUpdateTask(payload);
      expect(mockKanbanService.updateTask).toHaveBeenCalledWith('task-1', 'Updated', 'Updated Desc');
    });
  });

  describe('onMoveForward', () => {
    it('should move task forward when possible', () => {
      component.tasksByColumn = {
        todo: [mockTasks[0]],
        'in-progress': [],
        done: [],
      };
      component.onMoveForward('task-1');
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith('task-1', 'in-progress');
    });

    it('should not move task forward from done status', () => {
      component.tasksByColumn = {
        todo: [],
        'in-progress': [],
        done: [mockTasks[2]],
      };
      component.onMoveForward('task-3');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });

    it('should not move task if not found', () => {
      component.tasksByColumn = {
        todo: [],
        'in-progress': [],
        done: [],
      };
      component.onMoveForward('unknown-task');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });
  });

  describe('onMoveBack', () => {
    it('should move task back when possible', () => {
      component.tasksByColumn = {
        todo: [],
        'in-progress': [mockTasks[1]],
        done: [],
      };
      component.onMoveBack('task-2');
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith('task-2', 'todo');
    });

    it('should not move task back from todo status', () => {
      component.tasksByColumn = {
        todo: [mockTasks[0]],
        'in-progress': [],
        done: [],
      };
      component.onMoveBack('task-1');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });

    it('should not move task if not found', () => {
      component.tasksByColumn = {
        todo: [],
        'in-progress': [],
        done: [],
      };
      component.onMoveBack('unknown-task');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });
  });

  describe('toggleTheme', () => {
    it('should toggle isDarkMode to true', () => {
      component.isDarkMode = false;
      component.toggleTheme();
      expect(component.isDarkMode).toBeTrue();
    });

    it('should toggle isDarkMode to false', () => {
      component.isDarkMode = true;
      component.toggleTheme();
      expect(component.isDarkMode).toBeFalse();
    });

    it('should add dark-mode class when enabling dark mode', () => {
      component.isDarkMode = false;
      component.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBeTrue();
    });

    it('should remove dark-mode class when disabling dark mode', () => {
      component.isDarkMode = true;
      document.body.classList.add('dark-mode');
      component.toggleTheme();
      expect(document.body.classList.contains('dark-mode')).toBeFalse();
    });

    it('should set localStorage to dark when enabling', () => {
      component.isDarkMode = false;
      component.toggleTheme();
      expect(localStorage.getItem('kanban-theme')).toBe('dark');
    });

    it('should set localStorage to light when disabling', () => {
      component.isDarkMode = true;
      component.toggleTheme();
      expect(localStorage.getItem('kanban-theme')).toBe('light');
    });
  });

  describe('columns property', () => {
    it('should have 3 columns', () => {
      expect(component.columns.length).toBe(3);
    });

    it('should have correct column statuses', () => {
      const statuses = component.columns.map((col) => col.status);
      expect(statuses).toContain('todo');
      expect(statuses).toContain('in-progress');
      expect(statuses).toContain('done');
    });

    it('should have correct column titles', () => {
      const todoCol = component.columns.find((col) => col.status === 'todo');
      expect(todoCol?.title).toBe('To Do');
    });
  });

  describe('sortOptions property', () => {
    it('should have 3 sort options', () => {
      expect(component.sortOptions.length).toBe(3);
    });

    it('should have correct sort option values', () => {
      const values = component.sortOptions.map((opt) => opt.value);
      expect(values).toContain('manual');
      expect(values).toContain('newest');
      expect(values).toContain('oldest');
    });
  });
});
