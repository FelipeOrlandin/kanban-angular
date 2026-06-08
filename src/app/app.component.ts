import { Component } from '@angular/core';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';

@Component({
  selector: 'app-root',
  imports: [KanbanBoardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
