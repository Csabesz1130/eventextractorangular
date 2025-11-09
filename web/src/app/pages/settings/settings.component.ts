import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { NotificationService } from '../../core/notification.service';
import { fadeSlideIn } from '../../core/animations';

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      settings {
        id
        timezone
        defaultReminder
        autoApprove
        confidenceMin
      }
    }
  }
`;

const UPDATE_SETTINGS = gql`
  mutation UpdateSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) {
      id
      timezone
      defaultReminder
      autoApprove
      confidenceMin
    }
  }
`;

interface UserSettings {
  id?: string;
  timezone: string;
  defaultReminder: number;
  autoApprove: boolean;
  confidenceMin: number;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  animations: [fadeSlideIn]
})
export class SettingsComponent implements OnInit {
  settings: UserSettings = {
    timezone: 'UTC',
    defaultReminder: 30,
    autoApprove: false,
    confidenceMin: 0.7,
  };

  loading = true;
  saving = false;

  // Preview of what would auto-approve
  previewCount = 0;

  constructor(
    private apollo: Apollo,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apollo
      .query<{ me: { settings: UserSettings } }>({
        query: GET_ME,
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => result.data.me?.settings))
      .subscribe({
        next: (settings) => {
          if (settings) {
            this.settings = {
              timezone: settings.timezone || 'UTC',
              defaultReminder: settings.defaultReminder || 30,
              autoApprove: settings.autoApprove || false,
              confidenceMin: settings.confidenceMin || 0.7,
            };
          }
          this.loading = false;
          this.updatePreview();
        },
        error: (error) => {
          console.error('Failed to load settings:', error);
          this.loading = false;
        },
      });
  }

  saveSettings(): void {
    this.saving = true;

    this.apollo
      .mutate<{ updateSettings: UserSettings }>({
        mutation: UPDATE_SETTINGS,
        variables: {
          input: {
            timezone: this.settings.timezone,
            defaultReminder: this.settings.defaultReminder,
            autoApprove: this.settings.autoApprove,
            confidenceMin: this.settings.confidenceMin,
          },
        },
      })
      .pipe(map((result: any) => result.data?.updateSettings))
      .subscribe({
        next: (settings) => {
          if (settings) {
            this.settings = {
              ...this.settings,
              ...settings,
            };
          }
          this.saving = false;
          this.updatePreview();
          this.notifications.showSuccess('Settings saved successfully');
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
          this.saving = false;
          this.notifications.showError('Failed to save settings');
        },
      });
  }

  updatePreview(): void {
    // In a real implementation, you'd query pending suggestions
    // and count how many would auto-approve with current settings
    // For now, we'll just show a placeholder
    this.previewCount = 0; // TODO: Implement actual preview
  }

  onAutoApproveToggle(): void {
    this.updatePreview();
  }

  onConfidenceMinChange(): void {
    this.updatePreview();
  }

  getConfidencePercentage(): number {
    return Math.round(this.settings.confidenceMin * 100);
  }
}
