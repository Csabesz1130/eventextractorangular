import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { EventSuggestion } from './event.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  private _connected$ = new BehaviorSubject<boolean>(false);
  connected$ = this._connected$.asObservable();

  private _newSuggestion$ = new Subject<EventSuggestion>();
  newSuggestion$ = this._newSuggestion$.asObservable();

  private _error$ = new Subject<string>();
  error$ = this._error$.asObservable();

  constructor() {
    // Auto-connect on service initialization
    if (typeof WebSocket !== 'undefined') {
      this.connect();
    }
  }

  connect() {
    const wsUrl = this.getWebSocketUrl();
    if (!wsUrl) {
      console.warn('WebSocket URL not configured');
      return;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this._connected$.next(true);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_suggestion') {
            this._newSuggestion$.next(data.suggestion);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._error$.next('WebSocket connection error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this._connected$.next(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this._error$.next('Failed to connect to WebSocket');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this._error$.next('Failed to reconnect to WebSocket');
    }
  }

  private getWebSocketUrl(): string | null {
    // In development, use local WebSocket server
    // In production, use the API URL
    const apiUrl = 'http://localhost:8911';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:/, '');
    return `${wsProtocol}${wsHost}/ws`;
  }
}

