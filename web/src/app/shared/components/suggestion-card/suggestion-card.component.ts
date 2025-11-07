import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output() approve = new EventEmitter<void>();
  @Output() snooze = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() select = new EventEmitter<boolean>();
  
  editing = false;
  editedEvent: EventSuggestion = {} as EventSuggestion;

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
  
  onSelect() {
    if (this.selectable) {
      this.select.emit(!this.selected);
    }
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

