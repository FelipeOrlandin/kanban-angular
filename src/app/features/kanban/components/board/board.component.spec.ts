import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanBoardComponent } from './board.component';
import { KanbanService } from '../../services/kanban.service';
import { Task, TasksByColumn } from '../../models/task.model';
import { signal } from '@angular/core';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let mockKanbanService: jasmine.SpyObj<KanbanService>;

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'normal',
      order: 0,
      createdAt: '2024-06-01T10:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'in-progress',
      priority: 'high',
      order: 0,
      createdAt: '2024-06-02T10:00:00.000Z',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      priority: 'low',
      order: 0,
      createdAt: '2024-06-03T10:00:00.000Z',
    },
  ];

  function toTasksByColumn(tasks: Task[]): TasksByColumn {
    const columns: TasksByColumn = { todo: [], 'in-progress': [], 'on-hold': [], done: [] };
    for (const task of tasks) {
      columns[task.status].push(task);
    }
    return columns;
  }

  beforeEach(async () => {
    mockKanbanService = jasmine.createSpyObj('KanbanService', [
      'addTask',
      'deleteTask',
      'updateTask',
      'moveTask',
      'syncFromColumns',
      'toTasksByColumn',
    ]);

    // tasksByColumn must be a Signal (a function that returns the value when called)
    const tasksByColumnSignal = signal(toTasksByColumn(mockTasks));
    Object.defineProperty(mockKanbanService, 'tasksByColumn', {
      get: () => tasksByColumnSignal,
    });

    mockKanbanService.toTasksByColumn.and.callFake((tasks: Task[]) => toTasksByColumn(tasks));

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
    it('should load dark mode from localStorage', () => {
      localStorage.setItem('kanban-theme', 'dark');
      fixture = TestBed.createComponent(KanbanBoardComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.isDarkMode()).toBeTrue();
    });

    it('should not load dark mode if localStorage is light', () => {
      localStorage.setItem('kanban-theme', 'light');
      fixture = TestBed.createComponent(KanbanBoardComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.isDarkMode()).toBeFalse();
    });
  });

  describe('isDragEnabled', () => {
    it('should return true when search is empty and sort is manual', () => {
      component.searchText.set('');
      component.sortMode.set('manual');
      fixture.detectChanges();
      expect(component.isDragEnabled()).toBeTrue();
    });

    it('should return false when search has text', () => {
      component.searchText.set('search text');
      component.sortMode.set('manual');
      fixture.detectChanges();
      expect(component.isDragEnabled()).toBeFalse();
    });

    it('should return false when sort mode is not manual', () => {
      component.searchText.set('');
      component.sortMode.set('newest');
      fixture.detectChanges();
      expect(component.isDragEnabled()).toBeFalse();
    });
  });

  describe('totalTaskCount', () => {
    it('should return total count of all tasks', () => {
      expect(component.totalTaskCount()).toBe(3);
    });
  });

  describe('visibleTaskCount', () => {
    it('should return total count when drag is enabled', () => {
      component.searchText.set('');
      component.sortMode.set('manual');
      fixture.detectChanges();
      expect(component.visibleTaskCount()).toBe(3);
    });

    it('should return filtered count when search is active', () => {
      component.searchText.set('Task 1');
      component.sortMode.set('manual');
      fixture.detectChanges();
      expect(component.visibleTaskCount()).toBe(1);
    });
  });

  describe('filteredAndSortedTasksByColumn', () => {
    it('should return original when search is empty and sort is manual', () => {
      component.searchText.set('');
      component.sortMode.set('manual');
      fixture.detectChanges();
      const result = component.filteredAndSortedTasksByColumn();
      expect(result.todo.length).toBe(1);
      expect(result.todo[0].id).toBe('task-1');
    });

    it('should filter by title', () => {
      component.searchText.set('Task 1');
      component.sortMode.set('manual');
      fixture.detectChanges();
      const result = component.filteredAndSortedTasksByColumn();
      expect(result.todo.length).toBe(1);
      expect(result.todo[0].id).toBe('task-1');
    });

    it('should filter by description', () => {
      component.searchText.set('Description 2');
      component.sortMode.set('manual');
      fixture.detectChanges();
      const result = component.filteredAndSortedTasksByColumn();
      expect(result['in-progress'].length).toBe(1);
      expect(result['in-progress'][0].id).toBe('task-2');
    });

    it('should sort by newest', () => {
      component.searchText.set('');
      component.sortMode.set('newest');
      fixture.detectChanges();
      const result = component.filteredAndSortedTasksByColumn();
      expect(result.todo[0].createdAt).toBe('2024-06-01T10:00:00.000Z');
    });

    it('should sort by oldest', () => {
      component.searchText.set('');
      component.sortMode.set('oldest');
      fixture.detectChanges();
      const result = component.filteredAndSortedTasksByColumn();
      expect(result.todo[0].createdAt).toBe('2024-06-01T10:00:00.000Z');
    });
  });

  describe('onColumnDrop', () => {
    it('should call kanbanService.syncFromColumns', () => {
      component.onColumnDrop();
      expect(mockKanbanService.syncFromColumns).toHaveBeenCalled();
    });
  });

  describe('onAddTask', () => {
    it('should call kanbanService.addTask with title and description', () => {
      component.newTitle.set('New Task');
      component.newDescription.set('New Description');
      component.onAddTask();
      expect(mockKanbanService.addTask).toHaveBeenCalledWith('New Task', 'New Description');
    });

    it('should clear newTitle and newDescription after adding', () => {
      component.newTitle.set('New Task');
      component.newDescription.set('New Description');
      component.onAddTask();
      expect(component.newTitle()).toBe('');
      expect(component.newDescription()).toBe('');
    });

    it('should not add task if title is empty', () => {
      component.newTitle.set('   ');
      component.newDescription.set('Description');
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
    it('should call kanbanService.moveTask with the next status', () => {
      component.onMoveForward('task-1');
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith('task-1', 'in-progress');
    });

    it('should not move task forward from done status', () => {
      component.onMoveForward('task-3');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });
  });

  describe('onMoveBack', () => {
    it('should call kanbanService.moveTask with the previous status', () => {
      component.onMoveBack('task-2');
      expect(mockKanbanService.moveTask).toHaveBeenCalledWith('task-2', 'todo');
    });

    it('should not move task back from todo status', () => {
      component.onMoveBack('task-1');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });

    it('should not move task if not found', () => {
      component.onMoveBack('unknown-task');
      expect(mockKanbanService.moveTask).not.toHaveBeenCalled();
    });
  });

  describe('toggleTheme', () => {
    it('should toggle isDarkMode to true', () => {
      component.isDarkMode.set(false);
      component.toggleTheme();
      expect(component.isDarkMode()).toBeTrue();
    });

    it('should toggle isDarkMode to false', () => {
      component.isDarkMode.set(true);
      component.toggleTheme();
      expect(component.isDarkMode()).toBeFalse();
    });

    it('should set localStorage to dark when enabling', () => {
      component.isDarkMode.set(false);
      component.toggleTheme();
      expect(localStorage.getItem('kanban-theme')).toBe('dark');
    });

    it('should set localStorage to light when disabling', () => {
      component.isDarkMode.set(true);
      component.toggleTheme();
      expect(localStorage.getItem('kanban-theme')).toBe('light');
    });
  });

  describe('columns property', () => {
    it('should have 4 columns', () => {
      expect(component.columns.length).toBe(4);
    });

    it('should have correct column statuses', () => {
      const statuses = component.columns.map((col) => col.status);
      expect(statuses).toContain('todo');
      expect(statuses).toContain('in-progress');
      expect(statuses).toContain('on-hold');
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

  describe('searchFields property', () => {
    it('should have 3 search fields', () => {
      expect(component.searchFields.length).toBe(3);
    });
  });
});
