import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-connector-badge',
  templateUrl: './connector-badge.component.html',
  styleUrls: ['./connector-badge.component.scss']
})
export class ConnectorBadgeComponent {
  @Input() name = '';
  @Input() connected = false;
}

