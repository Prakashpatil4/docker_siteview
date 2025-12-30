import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnInit, signal } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { HttpClient } from '@angular/common/http';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FilterService } from '../../services/filter.service';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from "../notifications/notifications.component";
import { NotificationService } from "../../services/notification-service";
import { lastValueFrom } from "rxjs";
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, MatDatepickerModule,NotificationsComponent,
    MatFormFieldModule, MatInputModule, MatNativeDateModule, MatOptionModule, MatSelectModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private storageKey = 'currentUser';
  selectedSite: string = 'Select';

  selectedBusinessline: string = 'Select';
  userData: any;
  unreadCount: any;
  isLoading = signal<boolean>(false);
  constructor(private filterService: FilterService,private svc: NotificationService,  private eRef: ElementRef) {}
  ngOnInit(): void {

     this.getUnreadNotificationCount();
     this.userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }
  // async loadNotifications(payload: any) {
  async getUnreadNotificationCount() {
     this.isLoading.set(true);
      // this.userData.email  use this code for dynamic user_id
      let siteVal = '';
      if(this.selectedSite =='Select') {
        siteVal = 'ALL'
      } else {
         siteVal = this.selectedSite;
      }

       const payload = {
        "user_id": "oladri@google.com",
        "site": siteVal
      };
      try {
        const response: any = await lastValueFrom(this.svc.getNotificationUnreadCount(payload));
        console.log(response);
        this.unreadCount =   response.unread_count

      } catch (err) {
        console.error('Error fetching notifications:', err);

      } finally {
        this.isLoading.set(false);
       // this.loading = false;
      }
    }
  onSiteChange(): void {
    console.log(`HEADER: Sending site to service: '${this.selectedSite}'`);
    this.filterService.setSite(this.selectedSite);
    this.getUnreadNotificationCount()

  }

  onBusinessLineChange() {

    console.log(`HEADER: Sending business line to service: '${this.selectedBusinessline}'`);

    this.filterService.setBusinessLine(this.selectedBusinessline);
  }
 handleChildAlert() {
    //this.parentMessage = message;
    if(this.unreadCount !== 0 ) {
      this.unreadCount = this.unreadCount - 1;
    }

  }
  toggleMenu() {
    const dropdown = document.getElementById("menuDropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  }

  showNotification: boolean = false;
  hasNewNotifications = true;

  toggleNotification(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the click from immediately triggering the document listener
    this.showNotification = !this.showNotification;
  }

  closeNotification() {
    this.showNotification = false;
  }

  // This logic handles clicking outside to close the dropdown
  @HostListener("document:click", ["$event"])
  clickout(event: Event) {
    if (this.showNotification) {
      if (!this.eRef.nativeElement.contains(event.target)) {
        this.showNotification = false;
      }
    }
  }
}
