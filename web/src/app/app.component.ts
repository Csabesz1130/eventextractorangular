import { Component } from '@angular/core';
import { ThemeService } from './core/theme.service';
import { fadeSlideIn } from './core/animations';
import { EventService } from './services/event.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeSlideIn]
})
export class AppComponent {
  pageTitle = '';
  showQuickAdd = false;
  quickText = '';

  constructor(
    private theme: ThemeService,
    private events: EventService,
    router: Router
  ) {
    theme.init();
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const map: any = {
          '/inbox': 'Inbox',
          '/calendar': 'Calendar',
          '/connectors': 'Connectors',
          '/settings': 'Settings'
        };
        this.pageTitle = map[e.urlAfterRedirects] || 'EventFlow';
      });
  }

  toggleDark() {
    this.theme.toggle();
  }

  openQuickAdd() {
    this.showQuickAdd = true;
  }

  extractNow() {
    const t = this.quickText.trim();
    if (!t) return;
    this.showQuickAdd = false;
    this.events.extract(t).subscribe(ev => this.events.pushLocalSuggestion(ev));
    this.quickText = '';
  }
}

