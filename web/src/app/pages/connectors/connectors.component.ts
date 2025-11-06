import { Component } from '@angular/core';
import { ConnectorsService } from '../../services/connectors.service';

@Component({
  selector: 'app-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss']
})
export class ConnectorsComponent {
  googleConnected = false;
  userId = 'user_demo'; // replace with real id/auth in your app

  constructor(private svc: ConnectorsService) {}

  connectGoogle() {
    this.svc.googleStart(this.userId).subscribe(({ auth_url }) => {
      window.location.href = auth_url;
    });
  }

  pollOnce() {
    this.svc.gmailPollOnce().subscribe(() => {/* toast */});
  }
}

