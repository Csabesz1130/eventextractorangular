import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EventSuggestion {
  title: string;
  start: string;
  end?: string;
  timezone?: string;
  location?: string;
  attendees?: string[];
  description?: string;
  reminders?: number[];
  confidence?: number;
  raw_text_snippet?: string;
  source?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private base = 'http://localhost:8080'; // Direct connection in dev; use /api in production

  private _suggestions$ = new BehaviorSubject<EventSuggestion[]>([]);
  suggestions$ = this._suggestions$.asObservable();

  constructor(private http: HttpClient) {}

  extract(text: string): Observable<EventSuggestion> {
    return this.http.post<EventSuggestion>(`${this.base}/extract`, {
      text,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  approve(eventObj: EventSuggestion): Observable<any> {
    return this.http.post(`${this.base}/approve`, { event: eventObj });
  }

  pushLocalSuggestion(s: EventSuggestion) {
    const arr = this._suggestions$.value.slice();
    arr.unshift(s);
    this._suggestions$.next(arr);
  }

  removeSuggestion(s: EventSuggestion) {
    this._suggestions$.next(this._suggestions$.value.filter(x => x !== s));
  }
}

