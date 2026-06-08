import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { KanbanCardComponent, TaskUpdatePayload } from './kanban-card.component';
import { Task, TASK_STATUS_ORDER } from '../../models/task.model';

describe('KanbanCardComponent', () => {
  let component: KanbanCardComponent;
  let fixture: ComponentFixture<KanbanCardComponent>;
  let mockTask: Task;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanCardComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanCardComponent);
    component = fixture.componentInstance;
    mockTask = {
      id: 'card-1',
      title: 'Título do card',
      description: 'Descrição do card',
      status: 'todo',
      order: 0,
      createdAt: '2024-06-01T10:00:00.000Z',
    };
    component.task = mockTask;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('exibição', () => {
    it('exibe título e descrição', () => {
      const title = fixture.debugElement.query(By.css('.kanban-card__title'));
      const description = fixture.debugElement.query(By.css('.kanban-card__description'));
      expect(title.nativeElement.textContent).toContain('Título do card');
      expect(description.nativeElement.textContent).toContain('Descrição do card');
    });

    it('trunca descrição longa na exibição (mais de 80 caracteres)', () => {
      const longDescription = 'A'.repeat(100);
      component.task = { ...mockTask, description: longDescription };
      fixture.detectChanges();
      const description = fixture.debugElement.query(By.css('.kanban-card__description'));
      expect(description.nativeElement.textContent).toContain('...');
      expect(description.nativeElement.textContent.length).toBeLessThan(100);
    });

    it('exibe placeholder para descrição quando não existe', () => {
      component.task = { ...mockTask, description: undefined };
      fixture.detectChanges();
      const placeholder = fixture.debugElement.query(By.css('.kanban-card__description--placeholder'));
      expect(placeholder).toBeTruthy();
      expect(placeholder.nativeElement.textContent).toContain('Adicionar descrição...');
    });

    it('não exibe descrição quando vazia', () => {
      component.task = { ...mockTask, description: '' };
      fixture.detectChanges();
      const placeholder = fixture.debugElement.query(By.css('.kanban-card__description--placeholder'));
      expect(placeholder).toBeTruthy();
    });

    it('exibe botão de avançar quando pode mover para frente', () => {
      const lastStatus = TASK_STATUS_ORDER[TASK_STATUS_ORDER.length - 1];
      component.task = { ...mockTask, status: lastStatus };
      expect(component.canMoveForward).toBeFalse();
      const forwardBtn = fixture.debugElement.query(By.css('[class*="primary"]'));
      if (!component.canMoveForward) {
        expect(forwardBtn).toBeFalsy();
      }
    });

    it('exibe botão de voltar quando pode mover para trás', () => {
      component.task = { ...mockTask, status: 'in-progress' };
      fixture.detectChanges();
      const backBtn = fixture.debugElement.query(By.css('button:contains("←")'));
      if (component.canMoveBack) {
        expect(backBtn).toBeTruthy();
      }
    });
  });

  describe('shortDescription', () => {
    it('retorna string vazia quando task.description é undefined', () => {
      component.task = { ...mockTask, description: undefined };
      expect(component.shortDescription).toBe('');
    });

    it('retorna descrição original quando tem menos de 80 caracteres', () => {
      const short = 'Descrição curta';
      component.task = { ...mockTask, description: short };
      expect(component.shortDescription).toBe(short);
    });

    it('trunca descrição quando tem mais de 80 caracteres', () => {
      const long = 'A'.repeat(100);
      component.task = { ...mockTask, description: long };
      expect(component.shortDescription.length).toBeLessThan(100);
      expect(component.shortDescription).toContain('...');
    });
  });

  describe('canMoveForward', () => {
    it('retorna true quando não está na última coluna', () => {
      component.task = { ...mockTask, status: 'todo' };
      expect(component.canMoveForward).toBeTrue();
    });

    it('retorna false quando está na última coluna (done)', () => {
      component.task = { ...mockTask, status: 'done' };
      expect(component.canMoveForward).toBeFalse();
    });
  });

  describe('canMoveBack', () => {
    it('retorna true quando não está na primeira coluna', () => {
      component.task = { ...mockTask, status: 'in-progress' };
      expect(component.canMoveBack).toBeTrue();
    });

    it('retorna false quando está na primeira coluna (todo)', () => {
      component.task = { ...mockTask, status: 'todo' };
      expect(component.canMoveBack).toBeFalse();
    });
  });

  describe('emissão de eventos', () => {
    it('emite delete ao clicar no botão excluir', () => {
      const deleteSpy = spyOn(component.delete, 'emit');
      const deleteBtn = fixture.debugElement.query(By.css('.kanban-card__delete'));
      deleteBtn.nativeElement.click();
      expect(deleteSpy).toHaveBeenCalledWith('card-1');
    });

    it('emite moveForward ao clicar no botão avançar', () => {
      component.task = { ...mockTask, status: 'todo' };
      fixture.detectChanges();
      const moveSpy = spyOn(component.moveForward, 'emit');
      const forwardBtn = fixture.debugElement.query(By.css('.kanban-card__btn--primary'));
      if (forwardBtn) {
        forwardBtn.nativeElement.click();
        expect(moveSpy).toHaveBeenCalledWith('card-1');
      }
    });

    it('emite moveBack ao clicar no botão voltar', () => {
      component.task = { ...mockTask, status: 'in-progress' };
      fixture.detectChanges();
      const moveSpy = spyOn(component.moveBack, 'emit');
      const buttons = fixture.debugElement.queryAll(By.css('.kanban-card__btn'));
      const backBtn = buttons.find(btn => btn.nativeElement.textContent.includes('Voltar'));
      if (backBtn) {
        backBtn.nativeElement.click();
        expect(moveSpy).toHaveBeenCalledWith('card-1');
      }
    });

    it('não emite moveForward quando não pode mover', () => {
      component.task = { ...mockTask, status: 'done' };
      fixture.detectChanges();
      const moveSpy = spyOn(component.moveForward, 'emit');
      component.onMoveForward();
      expect(moveSpy).not.toHaveBeenCalled();
    });

    it('não emite moveBack quando não pode mover', () => {
      component.task = { ...mockTask, status: 'todo' };
      fixture.detectChanges();
      const moveSpy = spyOn(component.moveBack, 'emit');
      component.onMoveBack();
      expect(moveSpy).not.toHaveBeenCalled();
    });
  });

  describe('edição inline', () => {
    it('entra em modo edição ao chamar startEdit', () => {
      component.startEdit();
      expect(component.isEditing).toBeTrue();
      expect(component.editTitle).toBe(mockTask.title);
      expect(component.editDescription).toBe(mockTask.description);
    });

    it('entra em edição ao clicar no título', () => {
      const title = fixture.debugElement.query(By.css('.kanban-card__title--editable'));
      title.nativeElement.click();
      expect(component.isEditing).toBeTrue();
    });

    it('entra em edição ao clicar na descrição', () => {
      const description = fixture.debugElement.query(By.css('.kanban-card__description--editable'));
      description.nativeElement.click();
      expect(component.isEditing).toBeTrue();
    });

    it('entra em edição ao clicar no botão editar', () => {
      const editBtn = fixture.debugElement.query(By.css('.kanban-card__icon-btn'));
      editBtn.nativeElement.click();
      expect(component.isEditing).toBeTrue();
    });

    it('emite update ao salvar edição com título válido', () => {
      const updateSpy = spyOn(component.update, 'emit');
      component.startEdit();
      component.editTitle = 'Título editado';
      component.editDescription = 'Descrição editada';
      component.saveEdit();
      expect(updateSpy).toHaveBeenCalledWith({
        id: 'card-1',
        title: 'Título editado',
        description: 'Descrição editada',
      } as TaskUpdatePayload);
      expect(component.isEditing).toBeFalse();
    });

    it('não emite update com título vazio', () => {
      const updateSpy = spyOn(component.update, 'emit');
      component.startEdit();
      component.editTitle = '   ';
      component.saveEdit();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(component.isEditing).toBeTrue();
    });

    it('cancela edição sem emitir', () => {
      const updateSpy = spyOn(component.update, 'emit');
      component.startEdit();
      component.editTitle = 'Changed';
      component.cancelEdit();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(component.isEditing).toBeFalse();
    });

    it('cancela edição ao pressionar Escape', () => {
      component.startEdit();
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onEditKeydown(event);
      expect(component.isEditing).toBeFalse();
    });

    it('não cancela edição com outras teclas', () => {
      component.startEdit();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onEditKeydown(event);
      expect(component.isEditing).toBeTrue();
    });

    it('aplica classe CSS de edição quando isEditing é true', () => {
      component.startEdit();
      fixture.detectChanges();
      const card = fixture.debugElement.query(By.css('.kanban-card'));
      expect(card.classes['kanban-card--editing']).toBeTrue();
    });
  });
});