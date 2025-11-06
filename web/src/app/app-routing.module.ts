import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboxComponent } from './pages/inbox/inbox.component';
import { ConnectorsComponent } from './pages/connectors/connectors.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { SettingsComponent } from './pages/settings/settings.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inbox' },
  { path: 'inbox', component: InboxComponent },
  { path: 'connectors', component: ConnectorsComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: 'inbox' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

