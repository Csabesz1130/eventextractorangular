import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventService, EventSuggestion } from '../../services/event.service';
import { fadeSlideIn } from '../../core/animations';
import { UndoService } from '../../services/undo.service';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../core/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  animations: [fadeSlideIn]
})
export class InboxComponent implements OnInit, OnDestroy {
  suggestions: EventSuggestion[] = [];
  loading = true;
  selectedIds = new Set<string>();
  selectMode = false;
  groupedSuggestions: any = {};
  private subscriptions = new Subscription();

  constructor(
    private events: EventService,
    private undo: UndoService,
    private ws: WebSocketService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to suggestions
    this.subscriptions.add(
      this.events.suggestions$.subscribe(s => {
        this.suggestions = s;
        this.updateGrouping();
      })
    );

    // Subscribe to WebSocket for real-time suggestions
    this.subscriptions.add(
      this.ws.newSuggestion$.subscribe(suggestion => {
        this.notifications.showNewSuggestion(suggestion).onAction().subscribe(() => {
          // Scroll to the new suggestion
          const element = document.querySelector(`[data-suggestion-id="${suggestion.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        // Add to local suggestions
        this.events.pushLocalSuggestion(suggestion);
      })
    );

    this.loading = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get selectedCount() {
    return this.selectedIds.size;
  }

  get groupedSuggestionsList() {
    return Object.entries(this.groupedSuggestions).filter(([_, items]: [string, any]) => items.length > 0);
  }

  updateGrouping() {
    const groups: any = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: []
    };

    this.suggestions.forEach(s => {
      const start = s.start ? new Date(s.start) : null;
      if (!start) {
        groups.noDate.push(s);
      } else if (this.isToday(start)) {
        groups.today.push(s);
      } else if (this.isTomorrow(start)) {
        groups.tomorrow.push(s);
      } else if (this.isThisWeek(start)) {
        groups.thisWeek.push(s);
      } else {
        groups.later.push(s);
      }
    });

    this.groupedSuggestions = groups;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  isThisWeek(date: Date): boolean {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    return date >= today && date < weekFromNow;
  }

  getGroupLabel(key: string): string {
    const labels: any = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      later: 'Later',
      noDate: 'No Date'
    };
    return labels[key] || key;
  }

  toggleSelectMode() {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedIds.clear();
    }
  }

  onSelect(event: EventSuggestion, selected: boolean) {
    const id = this.getEventId(event);
    if (selected) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  isSelected(event: EventSuggestion): boolean {
    return this.selectedIds.has(this.getEventId(event));
  }

  getEventId(event: EventSuggestion): string {
    return `${event.start}-${event.title}`;
  }

  approveSelected() {
    const selected = this.suggestions.filter(s => this.isSelected(s));
    selected.forEach(s => {
      this.events.approve(s).subscribe(() => {
        this.undo.push('approve', s);
        this.events.removeSuggestion(s);
        this.selectedIds.delete(this.getEventId(s));
      });
    });
    if (this.selectedIds.size === 0) {
      this.selectMode = false;
    }
  }

  snoozeSelected() {
    const selected = this.suggestions.filter(s => this.isSelected(s));
    selected.forEach(s => {
      this.onSnooze(s);
      this.selectedIds.delete(this.getEventId(s));
    });
    if (this.selectedIds.size === 0) {
      this.selectMode = false;
    }
  }

  clearSelection() {
    this.selectedIds.clear();
    this.selectMode = false;
  }

  onApprove(s: EventSuggestion) {
    this.events.approve(s).subscribe(() => {
      this.undo.push('approve', s);
      this.events.removeSuggestion(s);
    });
  }

  onSnooze(s: EventSuggestion) {
    const rest = this.suggestions.filter(x => x !== s);
    this.suggestions = [...rest, s];
    this.updateGrouping();
  }

  onEdit(s: EventSuggestion) {
    // Event edited inline, update grouping
    this.updateGrouping();
  }
}

