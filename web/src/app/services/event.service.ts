import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface EventSuggestion {
  id?: string;
  title: string;
  start: string;
  end?: string;
  timezone?: string;
  location?: string;
  attendees?: string[];
  description?: string;
  reminders?: number[];
  confidence?: number;
  rawText?: string;
  source?: string;
  status?: string;
}

const EXTRACT_EVENT = gql`
  mutation ExtractEvent($input: ExtractEventInput!) {
    extractEvent(input: $input) {
      id
      title
      start
      end
      location
      confidence
      status
      source
      rawText
      timezone
      attendees
      reminders
      description
    }
  }
`;

const GET_SUGGESTIONS = gql`
  query GetSuggestions($status: SuggestionStatus, $limit: Int) {
    suggestions(status: $status, limit: $limit) {
      id
      title
      start
      end
      location
      confidence
      source
      status
      rawText
      timezone
      attendees
      reminders
      description
      createdAt
    }
  }
`;

const APPROVE_SUGGESTION = gql`
  mutation ApproveSuggestion($id: ID!) {
    approveSuggestion(id: $id) {
      id
      title
      start
      end
    }
  }
`;

const SNOOZE_SUGGESTION = gql`
  mutation SnoozeSuggestion($id: ID!, $until: DateTime!) {
    snoozeSuggestion(id: $id, until: $until) {
      id
      status
      snoozedUntil
    }
  }
`;

const GET_EVENTS = gql`
  query GetEvents($start: DateTime, $end: DateTime, $limit: Int) {
    events(start: $start, end: $end, limit: $limit) {
      id
      title
      start
      end
      location
      timezone
      attendees
      reminders
      description
      source
      confidence
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class EventService {
  private _suggestions$ = new BehaviorSubject<EventSuggestion[]>([]);
  suggestions$ = this._suggestions$.asObservable();

  constructor(private apollo: Apollo) {
    // Load initial suggestions
    this.loadSuggestions();
  }

  extract(text: string): Observable<EventSuggestion> {
    return this.apollo
      .mutate<{ extractEvent: EventSuggestion }>({
        mutation: EXTRACT_EVENT,
        variables: {
          input: {
            text,
            source: 'quick_add',
            sourceMeta: {},
          },
        },
      })
      .pipe(
        map((result: any) => {
          const suggestion = result.data?.extractEvent;
          if (suggestion) {
            this.pushLocalSuggestion(suggestion);
          }
          return suggestion!;
        })
      );
  }

  loadSuggestions(status = 'PENDING') {
    this.apollo
      .query<{ suggestions: EventSuggestion[] }>({
        query: GET_SUGGESTIONS,
        variables: { status, limit: 100 },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => result.data.suggestions))
      .subscribe((suggestions) => {
        this._suggestions$.next(suggestions);
      });
  }

  approve(eventObj: EventSuggestion): Observable<any> {
    if (!eventObj.id) {
      throw new Error('Event suggestion must have an ID');
    }

    return this.apollo
      .mutate({
        mutation: APPROVE_SUGGESTION,
        variables: { id: eventObj.id },
      })
      .pipe(
        map(() => {
          this.removeSuggestion(eventObj);
          // Reload suggestions to get updated list
          this.loadSuggestions();
        })
      );
  }

  snooze(eventObj: EventSuggestion, until: Date): Observable<any> {
    if (!eventObj.id) {
      throw new Error('Event suggestion must have an ID');
    }

    return this.apollo
      .mutate({
        mutation: SNOOZE_SUGGESTION,
        variables: {
          id: eventObj.id,
          until: until.toISOString(),
        },
      })
      .pipe(
        map(() => {
          // Reload suggestions
          this.loadSuggestions();
        })
      );
  }

  getEvents(start?: Date, end?: Date, limit = 100): Observable<EventSuggestion[]> {
    return this.apollo
      .query<{ events: EventSuggestion[] }>({
        query: GET_EVENTS,
        variables: {
          start: start?.toISOString(),
          end: end?.toISOString(),
          limit,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => result.data.events));
  }

  pushLocalSuggestion(s: EventSuggestion) {
    const arr = this._suggestions$.value.slice();
    arr.unshift(s);
    this._suggestions$.next(arr);
  }

  removeSuggestion(s: EventSuggestion) {
    this._suggestions$.next(
      this._suggestions$.value.filter((x) => x.id !== s.id)
    );
  }
}
