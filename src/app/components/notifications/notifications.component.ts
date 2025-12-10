import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { TimeAgoPipe } from './timeago';
import {
  NotificationItem,
  NotificationService,
} from '../../services/notification-service';
import { FilterService } from '../../services/filter.service';
// Update import path

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  all: NotificationItem[] = [];
  loading = false;

  // View Control
  initialCount = 5; // Enough to show the summary
  showAll = false;

  // Modal State
  isModalOpen = false;
  selectedData: any = null; // Will hold the full JSON for the modal
  selectedSite: string = '';

  constructor(
    private svc: NotificationService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.filterService.currentSite.subscribe(async (site) => {
      this.selectedSite = site;

      if (this.selectedSite == 'Select') {
        this.selectedSite = '';
      }

      const payload = {
        action: 'fetch_summary',
        role: 'SITEOPS',
        site: this.selectedSite,
      };

      await this.loadNotifications(payload);
    });
  }

  async loadNotifications(payload: any) {
    this.loading = true;
    try {
      const response: any = await lastValueFrom(
        this.svc.fetchNotificationSummary(payload)
      );

      this.transformData(response);
    } catch (err) {
      this.all = [];
    } finally {
      this.loading = false;
    }
  }

  transformData(apiData: any) {
    const list: NotificationItem[] = [];

    // ONLY create the Summary Item
    if (apiData.summaries[0].stats) {
      list.push({
        id: 1,
        title: `ELEVATE360 Summary: ${this.selectedSite || 'All Sites'}`,
        body: `📢 ${apiData.summaries[0].stats.total_alerts} Total Alerts across ${apiData.summaries[0].stats.impacted_manager_count} Teams.  Tap to view dashboard.`,
        time: apiData.summaries[0].date,
        icon: 'analytics', // Dashboard icon
        type: 'summary',
        fullData: apiData.summaries[0], // <--- Store the whole JSON here
      });
    }

    this.all = list;
  }

  // --- Modal Logic ---
  openDetails(item: NotificationItem) {
    this.selectedData = item.fullData;
    this.isModalOpen = true;
  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault(); // Good practice to prevent default anchor behaviors
    }
    this.isModalOpen = false;
    this.selectedData = null;
  }

  toggleView() {
    this.showAll = !this.showAll;
  }

  // --- Helpers for Dashboard Visualization ---

  // Calculate width for progress bars relative to the highest alert count
  getProgressWidth(count: number): string {
    if (!this.selectedData) return '0%';
    // Find max value to normalize bars (prevent overflow)
    const max = Math.max(
      ...this.selectedData.metric_insights.map((m: any) => m.alert_count),
      100
    );
    return Math.min((count / max) * 100, 100) + '%';
  }

  // Determine color based on severity (you can adjust thresholds)
  getSeverityColor(count: number): string {
    if (count > 500) return 'red';
    if (count > 100) return 'orange';
    return 'green';
  }
}
