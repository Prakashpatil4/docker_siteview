import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

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
  fullData?: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Dev  API URL
  private readonly siteOpsnotificationApiUrl = API_ENDPOINTS.DEV_NOTIFICATION;
  //  UAT API URL
  // private readonly siteOpsnotificationApiUrl = API_ENDPOINTS.UAT_NOTIFICATION;

  constructor(private http: HttpClient) {}

  /**
   * Fetches the count of unread notifications for a specific site, business line, and user.
   * @param payload Includes site, business_line, and user_id.
  */

  getNotificationUnreadCount(payload: any) {
    const business_line = payload.business_line;
    const encodedSite = encodeURIComponent(payload.site);
    const userEmail = payload.user_id;
    const url = `${this.siteOpsnotificationApiUrl}/notifications/unread-count/${encodedSite}?business_line=${business_line}&user_id=${userEmail}`;
    return this.http.get<any>(url);
  }

  /**
   * Retrieves a list of notifications based on site, business line, and user, with an optional data limit.
   * @param payload Includes site, business_line, user_id, and limit.
  */

  getNotificationData(payload: any) {
    const encodedSite = encodeURIComponent(payload.site);
    const userEmail = payload.user_id;
    const datalimit = payload.limit;
    const business_line = payload.business_line;
    const url = `${this.siteOpsnotificationApiUrl}/notifications/${encodedSite}?business_line=${business_line}&user_id=${userEmail}&limit=${datalimit}`;
    return this.http.get<any>(url);
  }

  /**
   * Fetches the full detailed information for a specific notification ID.
   * @param payload Includes notification_id and user_id.
   */

  getNotificationDetails(payload: any) {
    const userEmail = payload.user_id;
    const notificationId = payload.notification_id;

    const url = `${this.siteOpsnotificationApiUrl}/notifications/detail/${notificationId}?user_id=${userEmail}`;
    return this.http.get<any>(url);
  }

   /**
   * Sends a request to mark a specific notification as 'read' on the server.
   * @param payload Includes notification_id and user_id.
   */

  markNotificationRead(payload: any) {
    const userEmail = payload.user_id;
    const notificationId = payload.notification_id;
    const url = `${this.siteOpsnotificationApiUrl}/notifications/${notificationId}/read?user_id=${userEmail}`;
    return this.http.post(url, payload);
  }
}
