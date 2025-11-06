import { Component, OnInit } from '@angular/core';
import { EventService, EventSuggestion } from '../../services/event.service';
import { fadeSlideIn } from '../../core/animations';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  animations: [fadeSlideIn]
})
export class InboxComponent implements OnInit {
  suggestions: EventSuggestion[] = [];
  loading = true;

  constructor(private events: EventService) {}

  ngOnInit(): void {
    // seed with a stub list from backend if you have /suggestions endpoint; else leave empty
    this.events.suggestions$.subscribe(s => this.suggestions = s);
    this.loading = false;
  }

  onApprove(s: EventSuggestion) {
    this.events.approve(s).subscribe(() => {
      this.events.removeSuggestion(s);
    });
  }

  onSnooze(s: EventSuggestion) {
    // simple UX: move to end
    const rest = this.suggestions.filter(x => x !== s);
    this.suggestions = [...rest, s];
  }
}

