import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventService, EventSuggestion } from './event.service';

@Injectable({ providedIn: 'root' })
export class UndoService {
  private stack: Array<{ action: string; data: any }> = [];

  constructor(
    private snackBar: MatSnackBar,
    private events: EventService
  ) {}

  push(action: string, data: any) {
    this.stack.push({ action, data });
    this.showUndoToast(action);
  }

  undo() {
    const last = this.stack.pop();
    if (!last) return;

    if (last.action === 'approve') {
      // Re-add the event to suggestions
      this.events.pushLocalSuggestion(last.data);
      this.snackBar.open('Undone: Event restored', 'Close', { duration: 3000 });
    }
  }

  private showUndoToast(action: string) {
    const actionLabel = action === 'approve' ? 'Event approved' : action;
    this.snackBar
      .open(`${actionLabel} completed`, 'UNDO', { duration: 5000 })
      .onAction()
      .subscribe(() => this.undo());
  }
}

