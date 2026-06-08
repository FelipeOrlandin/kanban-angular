import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../models/task.model';
import { KanbanCardComponent } from './kanban-card.component';

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'card-1',
    title: 'Título do card',
    description: 'Descrição do card',
    status: 'todo',
    order: 0,
    createdAt: '2024-06-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('KanbanCardComponent', () => {
  let component: KanbanCardComponent;
  let fixture: ComponentFixture<KanbanCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanCardComponent);
    component = fixture.componentInstance;
    component.task = createTask();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe título e descrição', () => {
    const title = fixture.nativeElement.querySelector('.kanban-card__title');
    const description = fixture.nativeElement.querySelector('.kanban-card__description');

    expect(title.textContent).toContain('Título do card');
    expect(description.textContent).toContain('Descrição do card');
  });

  it('trunca descrição longa na exibição', () => {
    component.task = createTask({
      description: 'A'.repeat(100),
    });
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelector('.kanban-card__description');
    expect(description.textContent).toContain('...');
    expect(description.textContent.length).toBeLessThan(100);
  });

  it('emite delete ao clicar no botão excluir', () => {
    const deleteSpy = spyOn(component.delete, 'emit');

    const deleteBtn = fixture.nativeElement.querySelector('.kanban-card__delete') as HTMLButtonElement;
    deleteBtn.click();

    expect(deleteSpy).toHaveBeenCalledWith('card-1');
  });

  it('emite update ao salvar edição', () => {
    const updateSpy = spyOn(component.update, 'emit');

    component.startEdit();
    fixture.detectChanges();

    component.editTitle = 'Título editado';
    component.editDescription = 'Descrição editada';
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector(
      '.kanban-card__btn--primary'
    ) as HTMLButtonElement;
    saveBtn.click();

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'card-1',
      title: 'Título editado',
      description: 'Descrição editada',
    });
    expect(component.isEditing).toBeFalse();
  });

  it('não emite update com título vazio', () => {
    const updateSpy = spyOn(component.update, 'emit');

    component.startEdit();
    component.editTitle = '   ';
    component.saveEdit();

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
