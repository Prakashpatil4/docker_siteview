import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChartBar, faUserGroup, faStar, faCheckCircle, faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons';
library.add(faChartBar, faUserGroup, faStar, faCheckCircle, faAngleDoubleUp);

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
}).catch(err => console.error(err));