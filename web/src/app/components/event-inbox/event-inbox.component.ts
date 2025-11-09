import { Component, OnInit } from '@angular/core';
import { EventService, EventSuggestion } from '../../services/event.service';

@Component({
  selector: 'app-event-inbox',
  templateUrl: './event-inbox.component.html',
  styleUrls: ['./event-inbox.component.css']
})
export class EventInboxComponent implements OnInit {
  suggestions: EventSuggestion[] = [];

  constructor(private svc: EventService) {}

  ngOnInit() {
    this.svc.fetchMockSuggestions().subscribe(s => this.suggestions = s);
  }

  onApproved(ev: EventSuggestion) {
    this.suggestions = this.suggestions.filter(x => x !== ev);
    // optionally show toast / feedback
    alert('Event approved and written to calendar (stub)');
  }

  // helper to test a manual text -> extract flow
  testExtractManual(text: string) {
    this.svc.extract(text).subscribe(s => {
      this.suggestions.unshift(s);
    }, err => {
      console.error(err);
      alert('Extract failed');
    });
  }
}

