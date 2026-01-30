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
  metricsWeekDispaly: any;
  metricsMonthDispaly: any;
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
  // Add this method to handle the 'unknown' conversion
  getSeverityData(value: unknown): { count: number; label: string } {
    return value as { count: number; label: string };
  }


  getTrendItems(filterDirection: string): any[] {
    // 1. Safety check to ensure trends object exists
    const trends = this.digestData?.trends;
    if (!trends) return [];

    // 2. Extract metrics from both Daily and Monthly arrays
    const dailyMetrics = trends.daily_trends?.metrics || [];
    const monthlyMetrics = trends.monthly_trends?.metrics || [];

    // 3. Combine both lists into one
    const allMetrics = [...dailyMetrics, ...monthlyMetrics];

    // 4. Filter based on the direction (case-insensitive)
    return allMetrics.filter((item: any) => {
      const direction = item?.site_trend?.direction?.toLowerCase();
      return direction === filterDirection.toLowerCase();
    });
  }

  getStatusColor(status: string): string {
    if (!status) return 'var(--text-secondary)';

    // 1. Normalize: Convert "Needs Attention" -> "NEEDS_ATTENTION"
    // and "Critical" -> "CRITICAL"
    const normalizedStatus = status
      .toUpperCase() // Handles "critical" or "Critical"
      .replace(/\s+/g, '_'); // Handles spaces by turning them into underscores

    const colors: { [key: string]: string } = {
      CRITICAL: 'var(--red-500)',
      NEEDS_ATTENTION: 'var(--yellow-500)',
      GOOD: 'var(--blue-500)',
      EXCELLENT: 'var(--green-500)',
    };

    return colors[normalizedStatus] || 'var(--text-secondary)';
  }

  getMetricColor(value: number): string {
    if (value >= 70) return 'var(--green-500)';
    if (value >= 50) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }

  formatMetricName(name: string): string {
    console.log(name);
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
    this.expandedSections = {};
    this.activeAlertKey = null;
    if (this.digestData?.specializations?.specializations) {
      this.digestData.specializations.specializations.forEach((spec: any) => {
        spec.expanded = false;
      });
    }
    this.openSpec = null;
    this.openProd = null;

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
    const spec = this.digestData.specializations.specializations[index];
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

      const payload = {
        action: 'fetch_summary',
        role: 'SITEOPS',
        site: this.selectedSite,
      };
      await this.getNotificationData();
    });
  }



  async getNotificationData() {
    // Use dynamic email if available, fallback to default
    const userEmail = this.userData?.email;

    // Site logic
    const siteVal = this.selectedSite === 'Select' ? 'ALL' : this.selectedSite;

    const payload = {
      user_id: userEmail,
      site: siteVal,
      limit: 7,
    };

    this.loading = true;

    try {
      // Call the API ONCE
      const response: any = await lastValueFrom(
        this.svc.getNotificationData(payload)
      );

      // Process the data locally
      this.notifications = response.map((item: any) => {
        let extractedBrightSpots = 'N/A';
        let extractedStatusRisks = 'N/A';
        let extractedfocusrArea = 'N/A';

        // Only perform Regex if summary exists in this specific item
        if (item.summary) {
          // Regex to find text between **brightspots:** and the next ** header
          const brightSpotMatch = item.summary.match(
            /\*\*Bright Spots:\*\*\s*([^*]+)/
          );
          // Regex to find text between **Bright Spots:** and the next ** header
          const statusRiskMatch = item.summary.match(
            /\*\*Status & Risk:\*\*\s*([^*]+)/
          );

          const focusrAreasMatch = item.summary.match(
            /\*\*Focus Areas:\*\*\s*([^*]+)/
          );

          if (brightSpotMatch) extractedBrightSpots = brightSpotMatch[1].trim();
          if (statusRiskMatch) extractedStatusRisks = statusRiskMatch[1].trim();
          if (focusrAreasMatch)
            extractedfocusrArea = focusrAreasMatch[1].trim();
        }

        // Return the clean, formatted object for the UI
        return {
          notification_id: item.notification_id,
          is_read: item.is_read,
          created_at: item.report_date, // For timeago pipe
          brightspots: extractedBrightSpots,
          statusRisks: extractedStatusRisks,
          focusrAreas: extractedfocusrArea,
        };
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      this.notifications = []; // Reset on error
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
      user_id: this.userData.email,
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

    // 1. Positive states (Leading, Holding)
    if (s.includes('lead') || s.includes('hold')) {
      return 'leadership-leading';
    }

    // 2. Negative states (Lagging, Critical)
    if (s.includes('lag') || s.includes('crit')) {
      return 'leadership-lagging';
    }

    // 3. Neutral/Default states
    return 'leadership-stable';
  }
  // inside your component class
  openSpec: string | null = null;
  openProd: string | null = null;

  toggleSpec(specName: string) {
    this.openSpec = this.openSpec === specName ? null : specName;
    this.openProd = null;
  }

  // dashboard.component.ts

  // To track which sections are open
  expandedSections: { [key: string]: boolean } = {
    CRITICAL: false, // Default open
    HIGH: false, // Default open
    MEDIUM: false,
    LOW: false,
  };

  // Helper to group alerts by severity
  get groupedAlerts() {
    if (!this.digestData?.products?.alerts) return [];

    const groups = this.digestData.products.alerts.reduce(
      (acc: any, alert: any) => {
        const severity = alert.severity || 'INFO';
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(alert);
        return acc;
      },
      {}
    );

    // Convert to array of objects for easier looping and sorting
    return Object.keys(groups)
      .map((key) => ({
        severity: key,
        items: groups[key],
        count: groups[key].length,
      }))
      .sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1)); // Keep Critical at top
  }

  toggleSection(severity: string) {
    this.expandedSections[severity] = !this.expandedSections[severity];
  }
  activeAlertKey: string | null = null;
  expandAlerts(severity: string) {
    this.activeAlertKey = severity;
    const isCurrentlyExpanded = !!this.expandedSections[severity];

    this.expandedSections = {};

    if (!isCurrentlyExpanded) {
      this.expandedSections[severity] = true;
    }
  }


  hasValidDailyMetrics(metrics: any): boolean {
    if (!metrics) return false;

    const values = Object.values(metrics);
    if (values.length > 0) {
      const firstMetric: any = values[0];
      const lastWeek = firstMetric.last_week?.date_display;
      const thisWeek = firstMetric.this_week?.date_display;

      // Join them with a hyphen if both exist, otherwise fallback to 'N/A'
      if (lastWeek && thisWeek) {
        this.metricsWeekDispaly = `${lastWeek} TO ${thisWeek}`;
      } else {
        this.metricsWeekDispaly = lastWeek || thisWeek || 'N/A';
      }
    }
    return true;

  }

  hasValidMonthlyMetrics(metrics: any): boolean {
    if (!metrics) return false;
    const values = Object.values(metrics);
    if (values.length > 0) {
      const firstMetric: any = values[0];
      const lastMonth = firstMetric.last_month?.date_display;
      const thisMonth = firstMetric.this_month?.date_display;

      // Join them with a hyphen if both exist, otherwise fallback to 'N/A'
      if (lastMonth && thisMonth) {
        this.metricsMonthDispaly = `${lastMonth} TO  ${thisMonth}`;
      } else {
        this.metricsMonthDispaly = lastMonth || thisMonth || 'N/A';
      }
    }
    return true ;

  }
  toggleProd(prodName: string) {
    this.openProd = this.openProd === prodName ? null : prodName;
  }

  getTrendIcon(trend: string): string {
    if (trend === 'IMPROVING') return 'trending_up';
    if (trend === 'DECLINING') return 'trending_down';
    return 'remove';
  }
 // Generic function to find a record by frequency type
getRecordByFrequency(freqType: string) {
  if (!this.digestData || !this.digestData.focus) return null;

  return this.digestData.focus.find((item: { metric_info: { frequency: string; }; }) =>
    item.metric_info?.frequency === freqType
  );
}
  get dailyMetricsCount(): number {
    if (!this.digestData?.focus) return 0;
    return Object.values(this.digestData.focus).reduce(
      (total: number, spec: any) => {
        const dailyCount = Object.values(spec?.metric_info || {}).filter(
          (m: any) => m.frequency === 'DAILY'
        ).length;
        return total + dailyCount;
      },
      0
    );
  }

  get dailyAlerts() {
    return (
      this.digestData?.focus?.filter(
        (item: any) => item.metric_info?.frequency === 'DAILY'
      ) || []
    );
  }

  // Getter for Monthly Alerts
  get monthlyAlerts() {
    return (
      this.digestData?.focus?.filter(
        (item: any) => item.metric_info?.frequency === 'MONTHLY'
      ) || []
    );
  }
  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('healthy') || s.includes('active') || s.includes('met'))
      return 'status-healthy';
    if (s.includes('warning') || s.includes('risk')) return 'status-warning';
    if (s.includes('critical') || s.includes('unhealthy') || s.includes('low'))
      return 'status-critical';
    return '';
  }
  hasValidBreakdown(breakdown: any[]): boolean {
    if (!breakdown) return false;
    // Returns true if at least one item has a score > 0
    return breakdown.some((item) => item.volume_share_pct > 0);
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
    getTrendClass(t: any): string {
  const name = t?.metric_info?.display_name;
  const current = t?.site_trend?.current_period?.rate ?? 0;
  const previous = t?.site_trend?.previous_period?.rate ?? 0;
  const changePct = t?.site_trend?.change_pct ?? 0;

  // 1. Check for specific metrics
  if (name === 'Reopen Rate' || name === 'Escalation Rate') {
    return (previous - current >= 0) ? 'bg-success' : 'bg-danger';
  }

  // 3. Default fallback
  return changePct >= 0 ? 'bg-success' : 'bg-danger';
}
}
