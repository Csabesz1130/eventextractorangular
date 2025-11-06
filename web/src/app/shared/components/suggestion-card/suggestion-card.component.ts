import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventSuggestion } from '../../../services/event.service';

@Component({
  selector: 'app-suggestion-card',
  templateUrl: './suggestion-card.component.html',
  styleUrls: ['./suggestion-card.component.scss']
})
export class SuggestionCardComponent {
  @Input() event!: EventSuggestion;
  @Output() approve = new EventEmitter<void>();
  @Output() snooze = new EventEmitter<void>();

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
}

