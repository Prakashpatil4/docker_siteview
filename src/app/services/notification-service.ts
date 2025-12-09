import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";

// export interface NotificationItem {

//   title: string;


//   timestamp: Date;
//   icon?: string;
// }
export interface Contributor {
  name: string;
  team: string;
  score?: number;
  total_alerts?: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: Date;
  icon: string;
  type: 'summary' | 'insight';

  // Stores the FULL API response for the dashboard modal
  fullData?: any;
}


// export interface NotificationItem {
//   id: number;
//   title: string; // Will hold Metric Name (e.g., "FTR_Rate")
//   body: string;  // Will hold Alert Count (e.g., "1985 Alerts")
//   time: Date;    // Generated timestamp
//   icon: string;  // specific icon
//   type: 'summary' | 'insight';
//   details?: Contributor[]; // Store the contributors list here for the popup
// }

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly url = "https://jsonplaceholder.typicode.com/posts";
  private notificationApiUrl = 'https://elevate360-notification-service-803836599959.us-central1.run.app';
   //private notificationApiUrl = '/api/notifications'; // Use the proxy path

  constructor(private http: HttpClient) {}
fetchNotificationSummary(payload: any): Observable<any> {
    // The payload is now passed from the component
    return this.http.post(this.notificationApiUrl, payload);
}


}
