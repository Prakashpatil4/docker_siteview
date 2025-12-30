import {
  Component,
  effect,
  EventEmitter,
  Input,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { TimeAgoPipe } from './timeago';
import {
  NotificationItem,
  NotificationService,
} from '../../services/notification-service';
import { FilterService } from '../../services/filter.service';
import { SafeHtml } from '@angular/platform-browser';
// Update import path
interface MetricAlert {
  metric: string;
  metric_full_name: string;
  frequency: string;
  affected_tsrs: number;
  total_tsrs: number;
  avg_score: number;
  target: number;
  deviation: number;
  severity: string;
  primary_specialization: string;
  primary_specialization_pct: number;
}

interface SpecializationHealth {
  specialization: string;
  metrics: {
    volume: {
      cases_in_bad_tsrs: number;
      pct_of_total: number;
    };
    compliance_rate: number;
  };
  status: string;
  trending: string;
  top_products: {
    product: string;
    cases: number;
    pct: number;
  }[];
  tsrs_count: number;
  failing_metrics: string[];
}

interface TrendMetric {
  metric: string;
  metric_full_name: string;
  change_pct: number;
  recent_avg: number;
}

interface Workload {
  trends: {
    total_created: number;
    total_closed: number;
    net_flow: number;
    flow_status: string;
  };
  workload_status: string;
}

interface DigestData {
  metadata: {
    site_location: string;
    generated_at: string;
  };
  executive_summary: {
    total_tsrs_active: number;
    overall_compliance_rate: number;
    total_cases_7d: number;
    alert_level: string;
  };
  critical_alerts: MetricAlert[];
  specialization_health: SpecializationHealth[];
  volume_workload: Workload;
  emerging_trends: {
    declining_metrics: TrendMetric[];
    improving_metrics: TrendMetric[];
  };
  summary_insights: string[];
}

interface NotificationCard {
  type: 'critical' | 'warning' | 'info' | 'success';
  emoji: string;
  title: string;
  subtitle: string;
  badge: string;
  content: string; // Used to determine modal content
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  private storageKey = 'currentUser';
  latestNote: any;
  userData: any;
  all: NotificationItem[] = [];
  loading = false;

  unreadCount = input<number>(0);
  // View Control
  initialCount = 5; // Enough to show the summary
  showAll = false;

  // Modal State
  isModalOpen = false;
  selectedData: any = null; // Will hold the full JSON for the modal
  selectedSite: string = '';
  localCount: number | undefined;
  //digestData: any = null; // Will hold the JSON
  currentView: 'focus' | 'specializations' | 'products' | 'trends' = 'focus';

  // UI Flags
  showNotificationPanel = true;
  showReportModal = false;
  showDetailModal = false;
  selectedAlert: any = null;

  // Helper properties for the view
  greeting: string = '';
  headerInfo: string = '';
  alertInfo: any;

  digestData: any = null;
  // digestData: DigestData = this.getInitialDigestData(); // Load data from method
  notificationCards: NotificationCard[] = [];

  isPanelOpen: boolean = true;
  // isModalOpen: boolean = false;
  modalTitle: string = '';
  modalBodyContent: SafeHtml | undefined;
  // unreadCount = 0;
  @Output() unreadCountChange = new EventEmitter<number>();
  notifications: any;
  @Output() alertOccurred = new EventEmitter<string>();
  constructor(
    private svc: NotificationService,
    private filterService: FilterService
  ) {}

  closeReportModal() {
    this.showReportModal = false;
  }

  openAlertDetail(alert: any) {
    this.selectedAlert = alert;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    // this.selectedAlert = null;
  }
  getTrendItems(type: 'declining' | 'improving') {
    const daily = this.digestData?.emerging_trends?.daily?.[type] || [];
    const monthly = this.digestData?.emerging_trends?.monthly?.[type] || [];

    return [...daily, ...monthly];
  }
  getStatusColor(status: string): string {
    const colors: any = {
      CRITICAL: 'var(--red-500)',
      NEEDS_ATTENTION: 'var(--yellow-500)',
      GOOD: 'var(--blue-500)',
      EXCELLENT: 'var(--green-500)',
    };
    return colors[status] || 'var(--text-secondary)';
  }

  getMetricColor(value: number): string {
    if (value >= 70) return 'var(--green-500)';
    if (value >= 50) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }

  formatMetricName(name: string): string {
    // return name.replace(/_/g, ' ').replace(/Rate|Score/g, '');
    return String(name)
      .replace(/_/g, ' ')
      .replace(/Rate|Score/g, '');
  }

  getTrendCounts() {
    const daily = this.digestData?.emerging_trends?.daily || {};
    const monthly = this.digestData?.emerging_trends?.monthly || {};
    const declining =
      (daily.declining?.length || 0) + (monthly.declining?.length || 0);
    const improving =
      (daily.improving?.length || 0) + (monthly.improving?.length || 0);
    return { declining, improving };
  }

  switchView(view: 'focus' | 'specializations' | 'products' | 'trends') {
    this.currentView = view;
  }
  toggleNotificationPanel(event?: Event) {
    if (event) event.stopPropagation();
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel() {
    this.showNotificationPanel = false;
  }
  toggleSpecCard(index: number) {
    // We add a transient property to the spec object for UI toggling
    const spec = this.digestData.specialization_health[index];
    spec.expanded = !spec.expanded;
  }
  openFullReport(note: any) {
    this.currentView = 'focus';
    this.showReportModal = true;
    this.getNotificationDetails(note);
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
  }
  ngOnInit(): void {
    this.localCount = this.unreadCount(); // plainNumber is now exactly 3
    this.userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');

    this.notifications = '';
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
      await this.getNotificationData();
    });
  }

  async getNotificationData() {
    //  this.userData.email use this user_id as a dynamic for below payload
    let siteVal = '';

    if (this.selectedSite == '') {
      siteVal = 'ALL';
    } else {
      siteVal = this.selectedSite;
    }

    const payload = {
      user_id: 'oladri@google.com',
      site: siteVal,
      limit: this.localCount,
    };

    this.loading = true;
    try {
      const response: any = await lastValueFrom(
        this.svc.getNotificationData(payload)
      );

      this.notifications = response.map((item: any, i: number) => {

        let summaryData = {
          health_status: 'N/A',
          people_focus: 'N/A',
          key_areas: 'N/A',
        };

        if (item.summary) {
          try {
            const parsedSummary = JSON.parse(item.summary);
            summaryData.health_status = parsedSummary.health_status || 'N/A';
            summaryData.people_focus = parsedSummary.people_focus || 'N/A';
            summaryData.key_areas = parsedSummary.key_areas || 'N/A';
          } catch (e) {
            console.error(
              `Summary parsing failed for notification ${item.notification_id}`,
              e
            );
          }
        }

        const formattedItem: any = {
          notification_id: item.notification_id,
          is_read: item.is_read,
          created_at: item.created_at, // Add created_at for the timeago pipe
          summary: `Health Status: ${summaryData.health_status}`,
        };

        return formattedItem;

      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      this.all = [];
    } finally {
      this.loading = false;
    }
  }
  trackByFn(index: number, item: any) {
    return item.notification_id; // Tells Angular to track items by ID instead of index
  }
  // Inside your component.ts
  truncateText(text: string, limit: number): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
  async getNotificationDetails(note: any) {
    this.digestData = null;
    //this.loading = true;
    //  this.userData.email use this user_id as a dynamic for below payload
    //    "b41c862f-9dca-4d5d-bd0b-9331e27f8ce9"
    const payload = {
      user_id: 'oladri@google.com',
      notification_id: note.notification_id,
    };

    // this.loading = true;
    try {
      const response: any = await lastValueFrom(
        this.svc.getNotificationDetails(payload)
      );

     this.digestData = response.payload_json;

      if (!note.is_read) {
        const readResponse: any = await lastValueFrom(
          this.svc.markNotificationRead(payload)
        );
        if (readResponse.status == 'success') {
          note.is_read = true;
          this.alertOccurred.emit();
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      this.all = [];
    } finally {
      // this.loading = false;
    }
  }

  // --- Modal Logic ---
  openDetails(item: NotificationItem) {
    this.selectedData = item.fullData;
    this.isModalOpen = true;
  }
  getLeadershipClass(status: string): string {
    if (!status) return 'leadership-none';

    const s = status.toLowerCase();
    if (s.includes('lead')) return 'leadership-leading';
    if (s.includes('lag') || s.includes('crit')) return 'leadership-lagging';
    return 'leadership-stable'; // Default for "Maintaining" or "Developing"
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
