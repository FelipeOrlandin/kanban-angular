import { TestBed } from '@angular/core/testing';
import { Task, TaskStatus } from '../models/task.model';
import { KanbanService } from './kanban.service';

const STORAGE_KEY = 'kanban-tasks';

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

/** Acessa método privado normalizeTasks para testes unitários */
function normalizeTasks(service: KanbanService, tasks: Task[]): Task[] {
  return (service as unknown as { normalizeTasks(t: Task[]): Task[] }).normalizeTasks(tasks);
}

/** Cria instância fresca do service (lê localStorage no construtor) */
function createService(): KanbanService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(KanbanService);
}

describe('KanbanService', () => {
  let service: KanbanService;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageMock[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });
    spyOn(localStorage, 'clear').and.callFake(() => {
      localStorageMock = {};
    });

    service = createService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addTask()', () => {
    it('cria nova task com status todo e order correto', () => {
      spyOn(crypto, 'randomUUID').and.returnValue('11111111-1111-4111-8111-111111111111');

      service.addTask('  Nova tarefa  ', '  Descrição  ');

      const tasks = service.getTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0]).toEqual(
        jasmine.objectContaining({
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Nova tarefa',
          description: 'Descrição',
          status: 'todo',
          order: 0,
        })
      );
      expect(tasks[0].createdAt).toBeTruthy();
    });

    it('incrementa order ao adicionar na coluna todo', () => {
      spyOn(crypto, 'randomUUID').and.returnValues(
        '22222222-2222-4222-8222-222222222221',
        '33333333-3333-4333-8333-333333333331'
      );

      service.addTask('Primeira');
      service.addTask('Segunda');

      const todoTasks = service.getTasksByStatus('todo');
      expect(todoTasks.length).toBe(2);
      expect(todoTasks[0].order).toBe(0);
      expect(todoTasks[1].order).toBe(1);
    });

    it('não cria task com título vazio', () => {
      service.addTask('   ');
      expect(service.getTasks().length).toBe(0);
    });

    it('persiste no localStorage', () => {
      spyOn(crypto, 'randomUUID').and.returnValue('44444444-4444-4444-8444-444444444441');
      service.addTask('Persistir');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        jasmine.any(String)
      );
      const saved = JSON.parse(localStorageMock[STORAGE_KEY]) as Task[];
      expect(saved[0].title).toBe('Persistir');
    });
  });

  describe('moveTask()', () => {
    beforeEach(() => {
      localStorageMock[STORAGE_KEY] = JSON.stringify([
        createTask({ id: 't1', title: 'A', status: 'todo', order: 0 }),
        createTask({ id: 't2', title: 'B', status: 'todo', order: 1 }),
        createTask({ id: 't3', title: 'C', status: 'in-progress', order: 0 }),
      ]);
      service = createService();
    });

    it('muda status da task', () => {
      service.moveTask('t1', 'in-progress');

      const moved = service.getTasks().find((t) => t.id === 't1');
      expect(moved?.status).toBe('in-progress');
    });

    it('coloca task no final da coluna destino e normaliza ordem na origem', () => {
      service.moveTask('t1', 'in-progress');

      const inProgress = service.getTasksByStatus('in-progress');
      expect(inProgress.map((t) => t.id)).toEqual(['t3', 't1']);
      expect(inProgress[0].order).toBe(0);
      expect(inProgress[1].order).toBe(1);

      const todo = service.getTasksByStatus('todo');
      expect(todo.map((t) => t.id)).toEqual(['t2']);
      expect(todo[0].order).toBe(0);
    });

    it('não move se status for o mesmo', () => {
      const before = JSON.stringify(service.getTasks());
      service.moveTask('t1', 'todo');
      expect(JSON.stringify(service.getTasks())).toBe(before);
    });
  });

  describe('deleteTask()', () => {
    beforeEach(() => {
      localStorageMock[STORAGE_KEY] = JSON.stringify([
        createTask({ id: 't1', status: 'todo', order: 0 }),
        createTask({ id: 't2', status: 'todo', order: 1 }),
        createTask({ id: 't3', status: 'done', order: 0 }),
      ]);
      service = createService();
    });

    it('remove task pelo id', () => {
      service.deleteTask('t2');

      const tasks = service.getTasks();
      expect(tasks.find((t) => t.id === 't2')).toBeUndefined();
      expect(tasks.length).toBe(2);
    });

    it('reordena order da coluna após exclusão', () => {
      service.deleteTask('t1');

      const todo = service.getTasksByStatus('todo');
      expect(todo.length).toBe(1);
      expect(todo[0].id).toBe('t2');
      expect(todo[0].order).toBe(0);
    });
  });

  describe('updateTask()', () => {
    beforeEach(() => {
      localStorageMock[STORAGE_KEY] = JSON.stringify([
        createTask({ id: 't1', title: 'Antigo', description: 'Desc antiga' }),
      ]);
      service = createService();
    });

    it('altera título e descrição', () => {
      service.updateTask('t1', '  Novo título  ', '  Nova descrição  ');

      const task = service.getTasks()[0];
      expect(task.title).toBe('Novo título');
      expect(task.description).toBe('Nova descrição');
    });

    it('remove descrição quando vazia', () => {
      service.updateTask('t1', 'Só título', '   ');

      const task = service.getTasks()[0];
      expect(task.description).toBeUndefined();
    });

    it('não atualiza com título vazio', () => {
      service.updateTask('t1', '   ');
      expect(service.getTasks()[0].title).toBe('Antigo');
    });
  });

  describe('loadFromStorage()', () => {
    it('recupera dados do localStorage', () => {
      localStorageMock[STORAGE_KEY] = JSON.stringify([
        { id: 'a', title: 'Task A', status: 'todo', order: 0, createdAt: '2024-01-01' },
        { id: 'b', title: 'Task B', status: 'done', order: 0, createdAt: '2024-01-02' },
      ]);

      const loaded = createService();

      expect(loaded.getTasks().length).toBe(2);
      expect(loaded.getTasksByStatus('todo')[0]).toEqual(
        jasmine.objectContaining({ id: 'a', title: 'Task A' })
      );
      expect(loaded.getTasksByStatus('done')[0]).toEqual(
        jasmine.objectContaining({ id: 'b', title: 'Task B' })
      );
    });

    it('retorna array vazio quando localStorage está vazio', () => {
      expect(service.getTasks()).toEqual([]);
    });

    it('retorna array vazio quando JSON é inválido', () => {
      localStorageMock[STORAGE_KEY] = 'not-json{{{';
      const loaded = createService();
      expect(loaded.getTasks()).toEqual([]);
    });

    it('aplica defaults para campos ausentes', () => {
      spyOn(crypto, 'randomUUID').and.returnValue('55555555-5555-4555-8555-555555555551');

      localStorageMock[STORAGE_KEY] = JSON.stringify([{ title: 'Sem id' }]);
      const loaded = createService();
      const task = loaded.getTasks()[0];

      expect(task.id).toBe('55555555-5555-4555-8555-555555555551');
      expect(task.title).toBe('Sem id');
      expect(task.status).toBe('todo');
      expect(task.order).toBe(0);
      expect(task.createdAt).toBeTruthy();
    });
  });

  describe('normalizeTasks()', () => {
    it('reordena order sequencialmente em cada coluna', () => {
      const tasks = [
        createTask({ id: '1', status: 'todo', order: 5 }),
        createTask({ id: '2', status: 'todo', order: 2 }),
        createTask({ id: '3', status: 'in-progress', order: 3 }),
        createTask({ id: '4', status: 'done', order: 9 }),
        createTask({ id: '5', status: 'done', order: 1 }),
      ];

      const normalized = normalizeTasks(service, tasks);

      expect(normalized.find((t) => t.id === '2')?.order).toBe(0);
      expect(normalized.find((t) => t.id === '1')?.order).toBe(1);
      expect(normalized.find((t) => t.id === '3')?.order).toBe(0);
      expect(normalized.find((t) => t.id === '5')?.order).toBe(0);
      expect(normalized.find((t) => t.id === '4')?.order).toBe(1);
    });

    it('mantém status de cada task', () => {
      const tasks = [
        createTask({ id: '1', status: 'todo', order: 0 }),
        createTask({ id: '2', status: 'done', order: 0 }),
      ];

      const normalized = normalizeTasks(service, tasks);

      expect(normalized.find((t) => t.id === '1')?.status).toBe('todo');
      expect(normalized.find((t) => t.id === '2')?.status).toBe('done');
    });
  });
});
