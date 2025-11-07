import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './core/material.module';
import { InboxComponent } from './pages/inbox/inbox.component';
import { ConnectorsComponent } from './pages/connectors/connectors.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SuggestionCardComponent } from './shared/components/suggestion-card/suggestion-card.component';
import { ConnectorBadgeComponent } from './shared/components/connector-badge/connector-badge.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  declarations: [
    AppComponent,
    InboxComponent,
    ConnectorsComponent,
    CalendarComponent,
    SettingsComponent,
    SuggestionCardComponent,
    ConnectorBadgeComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    MaterialModule,
    AppRoutingModule,
    FullCalendarModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

