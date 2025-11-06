import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import '@angular/material/prebuilt-themes/indigo-pink.css';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
