import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NotificationItem,
  NotificationService,
} from "../../services/notification-service";
import { TimeAgoPipe } from "./timeago";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [CommonModule,TimeAgoPipe],
  templateUrl: "/notifications.component.html",
  styleUrls: ["./notifications.component.css"],
})
export class NotificationsComponent implements OnInit {
  all: NotificationItem[] = [];
  loading = false;

  // Configuration
  initialCount = 2; // Initially show only 2
  showAll = false; // State to track if list is expanded
   now = new Date();

  constructor(
    private svc: NotificationService, // Uncomment your service
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
     this.loading = true;
    try {
      this.all = await this.svc.fetchFirstN(7);
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
    }
  }

  // Toggle between showing 2 items and showing All items
  toggleView() {
    this.showAll = !this.showAll;
  }
}
