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
  private notificationReadUnredUrl = 'https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com/notifications/unread-count';


  constructor(private http: HttpClient) {}
fetchNotificationSummary(payload: any): Observable<any> {
    // The payload is now passed from the component
    return this.http.post(this.notificationApiUrl, payload);
}
getNotificationUnreadCount(payload: any)  {
  
    const encodedSite = encodeURIComponent(payload.site);
    const userEmail = payload.user_id;
 
   const url = `https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com/notifications/unread-count/${encodedSite}?user_id=${userEmail}`;
   return this.http.get<any>(url);
 }

getNotificationData(payload: any)  {
  console.log('service')
  const encodedSite = encodeURIComponent(payload.site);
  const userEmail = payload.user_id;
  const datalimit = payload.limit;
 
   const url = `https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com/notifications/${encodedSite}?user_id=${userEmail}&limit=${datalimit}`;
   return this.http.get<any>(url);
 }
 getNotificationDetails(payload: any)  {
  const userEmail = payload.user_id;
  const notificationId = payload.notification_id;
 
   const url = `https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com/notifications/detail/${notificationId}?user_id=${userEmail}`;
   return this.http.get<any>(url);
 }

  markNotificationRead(payload: any)  {
  const userEmail = payload.user_id;
  const notificationId = payload.notification_id;
 
   const url = `https://siteops-notif-service-dot-digital-sme.uc.r.appspot.com/notifications/${notificationId}/read?user_id=${userEmail}`;
  return this.http.post(url, payload);
   return this.http.get<any>(url);
 }
}
