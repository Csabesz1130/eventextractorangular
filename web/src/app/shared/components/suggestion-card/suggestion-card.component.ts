import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { EventSuggestion } from '../../../services/event.service';

@Component({
  selector: 'app-suggestion-card',
  templateUrl: './suggestion-card.component.html',
  styleUrls: ['./suggestion-card.component.scss']
})
export class SuggestionCardComponent {
  @Input() event!: EventSuggestion;
  @Input() selected = false;
  @Input() selectable = false;
  @Input() quickApprove = false; // Enable click-anywhere-to-approve
  @Output() approve = new EventEmitter<void>();
  @Output() snooze = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() select = new EventEmitter<boolean>();

  editing = false;
  editedEvent: EventSuggestion = {} as EventSuggestion;
  isApproving = false;

  get timeRange() {
    const s = this.event.start ? new Date(this.event.start) : null;
    const e = this.event.end ? new Date(this.event.end) : null;
    if (!s) return '';

    const sameDay = e && s.toDateString() === e.toDateString();
    const d = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
    const st = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const et = e ? e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return sameDay ? `${d}, ${st}–${et}` : `${d} ${st}${et ? (' → ' + et) : ''}`;
  }
  
  get confidenceClass() {
    const conf = this.event.confidence || 0;
    if (conf >= 0.7) return 'high-conf';
    if (conf >= 0.4) return 'med-conf';
    return 'low-conf';
  }
  
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Press 'a' to approve when card is focused
    if (event.key === 'a' && !this.editing && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.onApprove();
    }
    // Press 's' to snooze
    if (event.key === 's' && !this.editing && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.onSnooze();
    }
  }

  onCardClick() {
    // Click anywhere on card to approve if quickApprove is enabled
    if (this.quickApprove && !this.editing && !this.isApproving) {
      this.onApprove();
    }
  }

  onSelect() {
    if (this.selectable) {
      this.select.emit(!this.selected);
    }
  }

  onApprove() {
    if (this.isApproving) return;
    this.isApproving = true;
    this.approve.emit();
    // Reset after animation
    setTimeout(() => {
      this.isApproving = false;
    }, 300);
  }

  onSnooze() {
    this.snooze.emit();
  }
  
  startEdit() {
    this.editing = true;
    this.editedEvent = { ...this.event };
  }
  
  saveEdit() {
    this.event = { ...this.editedEvent };
    this.editing = false;
    this.edit.emit();
  }
  
  cancelEdit() {
    this.editing = false;
    this.editedEvent = {} as EventSuggestion;
  }
}

