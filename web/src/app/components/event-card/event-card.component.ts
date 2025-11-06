import { Component, Input, Output, EventEmitter } from '@angular/core';
import { EventService, EventSuggestion } from '../../services/event.service';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css']
})
export class EventCardComponent {
  @Input() event!: EventSuggestion;
  @Output() approved = new EventEmitter<EventSuggestion>();

  busy = false;

  constructor(private svc: EventService) {}

  onApprove() {
    this.busy = true;
    this.svc.approve(this.event).subscribe({
      next: _ => {
        this.approved.emit(this.event);
      },
      error: (err) => {
        console.error(err);
        alert('Approval failed');
      },
      complete: () => {
        this.busy = false;
      }
    });
  }
}

