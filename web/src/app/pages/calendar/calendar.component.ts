import { Component, OnInit } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventService, EventSuggestion } from '../../services/event.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: true,
    selectable: true,
    events: [],
    eventDrop: (info) => this.handleEventDrop(info),
    eventClick: (info) => this.handleEventClick(info),
    select: (info) => this.handleDateSelect(info)
  };

  constructor(private events: EventService) {}

  ngOnInit() {
    // Load events from service
    this.events.suggestions$.subscribe(suggestions => {
      this.calendarOptions.events = suggestions.map(s => this.convertToCalendarEvent(s));
    });
  }

  convertToCalendarEvent(suggestion: EventSuggestion): EventInput {
    return {
      id: `${suggestion.start}-${suggestion.title}`,
      title: suggestion.title || 'Untitled',
      start: suggestion.start,
      end: suggestion.end,
      backgroundColor: this.getColorForConfidence(suggestion.confidence || 0),
      extendedProps: {
        suggestion: suggestion
      }
    };
  }

  getColorForConfidence(confidence: number): string {
    if (confidence >= 0.7) return '#8cffd2'; // accent
    if (confidence >= 0.4) return '#6a9eff'; // primary
    return '#aab3c2'; // muted
  }

  handleEventDrop(info: any) {
    // Update event time when dragged
    const suggestion = info.event.extendedProps.suggestion;
    if (suggestion) {
      suggestion.start = info.event.start.toISOString();
      if (info.event.end) {
        suggestion.end = info.event.end.toISOString();
      }
    }
  }

  handleEventClick(info: any) {
    // Show event details or edit
    const suggestion = info.event.extendedProps.suggestion;
    if (suggestion) {
      // Could open a dialog here
      console.log('Event clicked:', suggestion);
    }
  }

  handleDateSelect(info: any) {
    // Create new event on date select
    console.log('Date selected:', info.startStr);
  }
}

