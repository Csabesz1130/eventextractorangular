import { Component, HostListener } from '@angular/core';
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
    private router: Router
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(e: KeyboardEvent) {
    // Cmd/Ctrl + K for Quick Add
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.openQuickAdd();
      return;
    }

    // Cmd/Ctrl + / for search (placeholder)
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      // TODO: Focus search when implemented
      return;
    }

    // Inbox-specific shortcuts
    if (this.router.url === '/inbox') {
      // 'a' to approve first, 's' to snooze first
      // 'j' and 'k' for navigation (can be added later)
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        // This would need to be handled by inbox component
        // For now, just prevent default
        e.preventDefault();
      }
    }
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

