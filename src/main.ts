import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // <--- using the config from step 1
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));