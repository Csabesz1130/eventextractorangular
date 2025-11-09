import { Injectable } from '@angular/core';
import { NotificationService } from '../core/notification.service';
import { EventService, EventSuggestion } from './event.service';

@Injectable({ providedIn: 'root' })
export class UndoService {
  private stack: Array<{ action: string, data: any, undoFn: () => void }> = [];

  constructor(
    private notifications: NotificationService,
    private events: EventService
  ) { }

  push(action: string, data: any, undoFn?: () => void) {
    const undo = undoFn || (() => {
      if (action === 'approve') {
        // Re-add suggestion to inbox
        this.events.pushLocalSuggestion(data as EventSuggestion);
      }
    });

    this.stack.push({ action, data, undoFn: undo });
    this.showUndoToast(action, undo);
  }

  undo() {
    const last = this.stack.pop();
    if (last?.undoFn) {
      last.undoFn();
    }
  }

  private showUndoToast(action: string, undoFn: () => void) {
    const actionText = action === 'approve' ? 'Event approved' : `${action} completed`;
    this.notifications.showWithUndo(actionText, undoFn, 5000);
  }
}

