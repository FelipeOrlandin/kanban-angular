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
    fixture.componentRef.setInput('task', mockTask);
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

    it('trunca descrição longa', () => {
      fixture.componentRef.setInput('task', { ...mockTask, description: 'A'.repeat(100) });
      fixture.detectChanges();
      const desc = fixture.debugElement.query(By.css('.kanban-card__description'));
      // Truncate pipe replaces last chars with '…' (single char)
      expect(desc.nativeElement.textContent).toContain('…');
    });
  });

  describe('canMoveForward / canMoveBack', () => {
    it('canMoveForward true no todo', () => {
      component.task.status = 'todo';
      fixture.detectChanges();
      expect(component.canMoveForward).toBeTrue();
    });
    it('canMoveForward false no done', () => {
      fixture.componentRef.setInput('task', { ...mockTask, status: 'done' });
      fixture.detectChanges();
      expect(component.canMoveForward).toBeFalse();
    });
    it('canMoveBack true no in-progress', () => {
      fixture.componentRef.setInput('task', { ...mockTask, status: 'in-progress' });
      fixture.detectChanges();
      expect(component.canMoveBack).toBeTrue();
    });
    it('canMoveBack false no todo', () => {
      component.task.status = 'todo';
      fixture.detectChanges();
      expect(component.canMoveBack).toBeFalse();
    });
  });

  describe('eventos de clique (públicos)', () => {
    it('delete emite ao clicar', () => {
      const spy = spyOn(component.delete, 'emit');
      fixture.debugElement.query(By.css('.kanban-card__delete')).nativeElement.click();
      expect(spy).toHaveBeenCalledWith('card-1');
    });

    it('moveForward emite ao clicar', () => {
      fixture.componentRef.setInput('task', { ...mockTask, status: 'todo' });
      fixture.detectChanges();
      const spy = spyOn(component.moveForward, 'emit');
      const btn = fixture.debugElement.query(By.css('.kanban-card__btn--primary'));
      if (btn) btn.nativeElement.click();
      expect(spy).toHaveBeenCalledWith('card-1');
    });

    it('moveBack emite ao clicar', () => {
      fixture.componentRef.setInput('task', { ...mockTask, status: 'in-progress' });
      fixture.detectChanges();
      const spy = spyOn(component.moveBack, 'emit');
      const btns = fixture.debugElement.queryAll(By.css('.kanban-card__btn'));
      const back = btns.find(b => b.nativeElement.textContent.includes('Voltar'));
      if (back) back.nativeElement.click();
      expect(spy).toHaveBeenCalledWith('card-1');
    });
  });

  describe('edição inline (usando "as any")', () => {
    it('startEdit ativa edição', () => {
      component.startEdit();
      expect((component as any).isEditing).toBeTrue();
      expect((component as any).editTitle).toBe(mockTask.title);
    });

    it('saveEdit emite update', () => {
      const spy = spyOn(component.update, 'emit');
      component.startEdit();
      (component as any).editTitle = 'Novo';
      (component as any).editDescription = 'Desc';
      component.saveEdit();
      expect(spy).toHaveBeenCalledWith({ id: 'card-1', title: 'Novo', description: 'Desc' });
      expect((component as any).isEditing).toBeFalse();
    });

    it('saveEdit não salva se título vazio', () => {
      const spy = spyOn(component.update, 'emit');
      component.startEdit();
      (component as any).editTitle = '   ';
      component.saveEdit();
      expect(spy).not.toHaveBeenCalled();
      expect((component as any).isEditing).toBeTrue();
    });

    it('cancelEdit sai sem emitir', () => {
      const spy = spyOn(component.update, 'emit');
      component.startEdit();
      component.cancelEdit();
      expect(spy).not.toHaveBeenCalled();
      expect((component as any).isEditing).toBeFalse();
    });

    it('Escape cancela edição', () => {
      component.startEdit();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      (component as any).onEditKeydown(event);
      expect((component as any).isEditing).toBeFalse();
    });
  });
});