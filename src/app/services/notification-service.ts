import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly url = 'https://jsonplaceholder.typicode.com/posts';
  private notificationApiUrl =
    'https://elevate360-notification-service-803836599959.us-central1.run.app';

  private siteOpsnotificationApiUrl =
    'https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com';

  constructor(private http: HttpClient) {}
  fetchNotificationSummary(payload: any): Observable<any> {
    // The payload is now passed from the component
    return this.http.post(this.notificationApiUrl, payload);
  }
  getNotificationUnreadCount(payload: any) {
    const encodedSite = encodeURIComponent(payload.site);
    const userEmail = payload.user_id;
    const url = `${this.siteOpsnotificationApiUrl}/notifications/unread-count/${encodedSite}?user_id=${userEmail}`;
    return this.http.get<any>(url);
  }

  getNotificationData(payload: any) {
    const encodedSite = encodeURIComponent(payload.site);
    const userEmail = payload.user_id;
    const datalimit = payload.limit;

    const url = `${this.siteOpsnotificationApiUrl}/notifications/${encodedSite}?user_id=${userEmail}&limit=${datalimit}`;
    return this.http.get<any>(url);
  }
  getNotificationDetails(payload: any) {
    const userEmail = payload.user_id;
    const notificationId = payload.notification_id;

    const url = `${this.siteOpsnotificationApiUrl}/notifications/detail/${notificationId}?user_id=${userEmail}`;
    return this.http.get<any>(url);
  }

  markNotificationRead(payload: any) {
    const userEmail = payload.user_id;
    const notificationId = payload.notification_id;

    const url = `${this.siteOpsnotificationApiUrl}/notifications/${notificationId}/read?user_id=${userEmail}`;
    return this.http.post(url, payload);
  }
}
