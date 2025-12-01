import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
providers: [
    provideRouter(routes), // <--- ADD THIS LINE to turn on the Router
    provideHttpClient()
  ]
};
