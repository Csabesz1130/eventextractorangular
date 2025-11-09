import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(
    private snackBar: MatSnackBar
  ) {}

  showSuccess(message: string, action?: string, duration = 3000): MatSnackBarRef<SimpleSnackBar> {
    return this.snackBar.open(message, action, {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showError(message: string, action?: string, duration = 5000): MatSnackBarRef<SimpleSnackBar> {
    return this.snackBar.open(message, action, {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showInfo(message: string, action?: string, duration = 3000): MatSnackBarRef<SimpleSnackBar> {
    return this.snackBar.open(message, action, {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showNewSuggestion(suggestion: any): MatSnackBarRef<SimpleSnackBar> {
    const message = `New event detected: ${suggestion.title || 'Untitled'}`;
    return this.snackBar.open(message, 'VIEW', {
      duration: 5000,
      panelClass: ['suggestion-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showWithUndo(message: string, undoAction: () => void, duration = 5000): MatSnackBarRef<SimpleSnackBar> {
    const snackBarRef = this.snackBar.open(message, 'UNDO', {
      duration,
      panelClass: ['undo-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });

    snackBarRef.onAction().subscribe(() => {
      undoAction();
    });

    return snackBarRef;
  }
}

