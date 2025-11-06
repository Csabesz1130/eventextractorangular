import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ConnectorsService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  googleStart(userId: string) {
    return this.http.get<{ auth_url: string }>(`${this.base}/auth/google/start`, { params: { user_id: userId } });
  }

  gmailPollOnce() {
    return this.http.get(`${this.base}/gmail/poll_once`);
  }
}

