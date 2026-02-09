import { Component, OnInit } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CesDataService } from '../../services/ces-data.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { HttpClient } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { FilterService } from '../../services/filter.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; // Import the module
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUserGroup, faStar } from '@fortawesome/free-solid-svg-icons';
import emailjs from '@emailjs/browser';
import { ChatWindowComponent } from '../chat-window/chat-window.component';

interface SiteStats {
  associates: number;
  top: number;
  avg: number;
  bottom: number;
  kudos: string;
}
interface Person {
  name: string;
  status: string;
  specialization: string;
}
interface CesData {
  string_field_6: string;
  string_field_9: string;
}

interface AnnouncementForm {
  specialization: string;
  message: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    FontAwesomeModule,
    ChatWindowComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  totalAssociates = 0;
  topPerformers = 0;
  averagePerformers = 0;
  bottomPerformers = 0;

  form: AnnouncementForm = {
    specialization: 'all', // Default to 'all'
    message: '',
  };

  messages: string[] = [
    'Kudos, you are doing an amazing job!',
    'Great work! Keep up the momentum!',
    'You’re making excellent progress!',
    'Fantastic effort! Your dedication shows.',
    'Keep shining! Your work is incredible.',
    'Success is the sum of small efforts.',
    'Teamwork makes the dream work.',
    'Believe you can and you’re halfway there.',
    'The secret of getting ahead is getting started.',
    'Your hard work is paying off!',
    'The best way to predict the future is to create it.',
    'Every moment is a fresh beginning.',
  ];

  currentMessage: string = '';
  isShowChatWindow = false;
  selectedUserId: number = 310;
  showAgentButton = false;
  showAgent: boolean = false;

  getNextMessage() {
    let currentIndex = parseInt(
      localStorage.getItem('messageIndex') || '0',
      10
    );
    this.currentMessage = this.messages[currentIndex];
    currentIndex++;
    if (currentIndex >= this.messages.length) {
      currentIndex = 0;
    }
    localStorage.setItem('messageIndex', currentIndex.toString());
  }

  private fromEmail: string = 'Testing Mail';

  constructor(
    private http: HttpClient,
    private googleAuth: GoogleAuthService,
    private cesDataService: CesDataService,
    private filterService: FilterService
  ) {
    library.add(faUserGroup, faStar);
  }
  selectedSite: string = 'Select';
  selectedBusinessline: string = 'Select';

  selectedSpecialization: string = 'All Specializations';
  specializations: string[] = [
    'All Specializations',
    'Compute',
    'DevOps',
    'Security',
    'GKE',
    'Networking',
    'Databases',
    'Data Analytics',
    'AI/ML',
    'Serverless',
    'Storage',
  ];

  siteStats: any;
  startDate!: Date;
  endDate!: Date;
  minDate!: Date;
  maxDate!: Date;
  allItems: any[] = [];
  filteredItems: any[] = [];
  searchTerm: string = '';
  filteredPopupContent: string[] = [];
  cesData: any[] = [];
  sheetData: any[] = [];
  headers: string[] = [];
  trainingSheetHeaders: string[] = [];
  trainingSheetData: any[] = [];
  nestedCount = 0;
  readyCount = 0;
  trainingCount = 0;
  onboardingCount = 0;
  data: Person[] = [];

  onSearchAssociate() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPopupContent = this.popupContent.filter((name) =>
      name.toLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    this.minDate = new Date(Date.UTC(2025, 0, 1));
    this.maxDate = new Date();
    this.startDate = this.minDate;
    this.endDate = this.maxDate;

    this.getNextMessage();
    this.filterService.currentSite.subscribe((site) => {
      console.log(`DASHBOARD: Received new site from service: '${site}'`);
      this.selectedSite = site;
      this.applyFilter();
    });
    this.filterService.currentBusinessLine.subscribe((businessLine) => {
      console.log(
        `DASHBOARD: Received new business line from service: '${businessLine}'`
      );

      this.selectedBusinessline = businessLine;
      this.applyFilter();
    });
    const spreadsheetId = '1mfnbjmMP6nUavrjlV5C_g7W1S4Hx72jABsfY-aQiT10';
    const range = 'TSR_LDAP_wise_Performance!A1:D189';
    const apiKey = 'AIzaSyB2Wal4dub_mS231LVH2yq_oPQBckF74Q4';
    this.googleAuth.getSheetData(spreadsheetId, range, apiKey).then((data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return;
      }
      //columns
      this.headers = data[0];
      this.sheetData = data.slice(1);
      const ratingIndex = this.headers.indexOf('Rating');
      const nameIndex = this.headers.indexOf('Name');
      const statusIndex = this.headers.indexOf('Status');
      const specializationIndex = this.headers.indexOf('Specialization');
      //stat grid
      this.totalAssociates = this.sheetData.length;
      this.topPerformers = this.sheetData.filter(
        (row) => row[ratingIndex] == 5 || row[ratingIndex] == 4
      ).length;
      this.averagePerformers = this.sheetData.filter(
        (row) => row[ratingIndex] == 3
      ).length;
      this.bottomPerformers = this.sheetData.filter(
        (row) => row[ratingIndex] == 2 || row[ratingIndex] == 1
      ).length;

      this.data = this.sheetData
        .map((row) => ({
          name: row[nameIndex]?.trim(),
          status: row[statusIndex]?.trim(),
          specialization: row[specializationIndex]?.trim(),
        }))
        .filter((row) => row.name && row.status && row.specialization);
      this.calculateCounts();
    });
    this.fetchTrainingSheetData();

    emailjs.init({
      publicKey: '4177LkedBuEy5l2mE',
    });
  }

  send() {
    console.log('Sending announcement:', this.form);

    const apiUrl = 'http://localhost:3001/api/send-announcement';

    // 4. Manually build the payload to send to the backend
    const payload = {
      specialization: this.form.specialization,
      message: this.form.message,
      from_email: this.fromEmail, // ⬅️ Add the hardcoded email here
    };

    // 5. Send the new payload
    this.http.post(apiUrl, payload).subscribe({
      next: (response) => {
        console.log('SUCCESS!', response);
        alert('Your announcement has been sent!');
        this.form.message = ''; // Reset form
      },
      error: (err) => {
        console.error('FAILED...', err);
        alert(`Failed to send the message: ${err.error?.error || err.message}`);
      },
    });
  }

  applyFilter() {
    if (!this.startDate || !this.endDate) {
      return;
    }
    if (this.startDate > this.endDate) {
      console.error('Start date cannot be after end date.');
      return;
    }
    const formattedStart = this.formatDate(this.startDate);
    const formattedEnd = this.formatDate(this.endDate);
    this.filterService.setDateRange(formattedStart,formattedEnd);
    this.filterService.setAgentButtonVisibility(true);
    const isVisible = this.filterService.isAgentButtonVisible;
    if (isVisible) {
     this.filterService.setAgentButtonVisibility(true);
    }
    console.log(
      'API CALL: Preparing to send these params:' +
        ` Start Date: ${formattedStart}, End Date: ${formattedEnd}, Business Line: ${this.selectedBusinessline}, Site: ${this.selectedSite}`
    );

    const params = {
      startDate: formattedStart,
      endDate: formattedEnd,
      businessLine: this.selectedBusinessline,
      site: this.selectedSite,
    };

    // this.http.get<any>('http://localhost:3001/api/ces-data', {
    //   params: {
    //     startDate: formattedStart,
    //     endDate: formattedEnd,
    //     businessLine: this.selectedBusinessline,
    //     site: this.selectedSite
    //   }
    // }).subscribe({
    //   next: (response) => {
    //     console.log('API CALL: Succeeded. Response:', response);
    //     // You can assign response to a variable to use in your template
    //     this.cesData = response;
    //   },
    //   error: (error) => console.error('Error fetching data:', error)
    // });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showCesPopup = false;
  openCesPopup() {
    this.applyFilter();
    this.showCesPopup = true;
  }
  closeCesPopup() {
    this.showCesPopup = false;
  }

  //sdr
  showSdrPopup = false;
  sdrPopupData: { specialization: string; sdr_count: number }[] = [];
  sdrPopupTitle = 'SDR by Specialization';

  openSdrPopup() {
    this.showSdrPopup = true;
    this.http
      .get<any>('http://localhost:3001/api/sdr-by-specialization', {
        params: {
          startDate: this.formatDate(this.startDate),
          endDate: this.formatDate(this.endDate),
          businessLine: this.selectedBusinessline,
          site: this.selectedSite,
        },
      })
      .subscribe({
        next: (data) => {
          console.log('SDR API response:', data);
          this.sdrPopupData = data;
        },
        error: (error) => {
          console.error('Error fetching SDR data:', error);
          this.sdrPopupData = [];
        },
      });
  }
  closeSdrPopup() {
    this.showSdrPopup = false;
  }
  //esc_rate
  showEscalationPopup = false;
  escalationPopupData: {
    site: string;
    total_escalation: number;
    total_closed_volume: number;
    escalation_rate: number;
  }[] = [];
  escalationPopupTitle = 'Escalation Rate';

  openEscalationPopup() {
    this.showEscalationPopup = true;
    this.http
      .get<any>('http://localhost:3001/api/escalation-rate', {
        params: {
          startDate: this.formatDate(this.startDate),
          endDate: this.formatDate(this.endDate),
          businessLine: this.selectedBusinessline,
          site: this.selectedSite,
        },
      })
      .subscribe({
        next: (data) => {
          console.log('Escalation API response:', data);
          this.escalationPopupData = [data];
        },
        error: (error) => {
          console.error('Error fetching escalation rate data:', error);
          this.escalationPopupData = [];
        },
      });
  }

  closeEscalationPopup() {
    this.showEscalationPopup = false;
  }

  async loadData() {
    const spreadsheetId = '1mfnbjmMP6nUavrjlV5C_g7W1S4Hx72jABsfY-aQiT10';
    const range = 'TSR_LDAP_wise_Performance!A1:D189';
    this.sheetData = await this.googleAuth.getSheetData(
      spreadsheetId,
      range,
      'AIzaSyB2Wal4dub_mS231LVH2yq_oPQBckF74Q4'
    );
  }

  fetchTrainingSheetData() {
    const spreadsheetId = '1mfnbjmMP6nUavrjlV5C_g7W1S4Hx72jABsfY-aQiT10';
    const range = 'Training!A1:C21';
    const apiKey = 'AIzaSyB2Wal4dub_mS231LVH2yq_oPQBckF74Q4';

    this.googleAuth.getSheetData(spreadsheetId, range, apiKey).then((data) => {
      this.trainingSheetHeaders = data[0];
      const nameIndex = this.trainingSheetHeaders.indexOf('Name');
      const statusIndex = this.trainingSheetHeaders.indexOf('Status');
      const rows = data.slice(1);
      const specIndex = this.trainingSheetHeaders.indexOf('Specialization');

      this.data = rows
        .map((row) => ({
          name: row[nameIndex]?.trim(),
          status: row[statusIndex]?.trim(),
          specialization: row[specIndex]?.trim(),
        }))
        .filter((row) => row.name && row.status && row.specialization);

      this.calculateCounts();
    });
  }

  calculateCounts() {
    const filtered =
      this.selectedSpecialization === 'All Specializations'
        ? this.data
        : this.data.filter(
            (d) =>
              d.specialization.toLowerCase() ===
              this.selectedSpecialization.toLowerCase()
          );
    this.nestedCount = filtered.filter(
      (d) => d.status?.toLowerCase() === 'nested'
    ).length;
    this.readyCount = filtered.filter(
      (d) => d.status?.toLowerCase() === 'ready'
    ).length;
    this.trainingCount = this.nestedCount + this.readyCount;
    this.onboardingCount = filtered.filter(
      (d) => d.status?.toLowerCase() === 'onboarding'
    ).length;
  }
  selectedMission: string = '';
  missionData: { [key: string]: { name: string; score: number }[] } = {
    Quality: [
      { name: 'Compute', score: 5 },
      { name: 'DevOps', score: 4 },
      { name: 'Security', score: 5 },
      { name: 'GKE', score: 5 },
      { name: 'Networking', score: 5 },
      { name: 'Databases', score: 4 },
      { name: 'Data Analytics', score: 4 },
      { name: 'AI/ML', score: 5 },
      { name: 'Serverless', score: 5 },
      { name: 'Storage', score: 4 },
    ],
    'Average FMR': [
      { name: 'Compute', score: 5 },
      { name: 'DevOps', score: 4 },
      { name: 'Security', score: 5 },
      { name: 'GKE', score: 5 },
      { name: 'Networking', score: 5 },
      { name: 'Databases', score: 4 },
      { name: 'Data Analytics', score: 4 },
      { name: 'AI/ML', score: 5 },
      { name: 'Serverless', score: 5 },
      { name: 'Storage', score: 4 },
    ],
    'Hard Consult Rate': [
      { name: 'Compute', score: 5 },
      { name: 'DevOps', score: 4 },
      { name: 'Security', score: 5 },
      { name: 'GKE', score: 5 },
      { name: 'Networking', score: 5 },
      { name: 'Databases', score: 4 },
      { name: 'Data Analytics', score: 4 },
      { name: 'AI/ML', score: 5 },
      { name: 'Serverless', score: 5 },
      { name: 'Storage', score: 4 },
    ],
    'Signal Ratio': [
      { name: 'Hard Signal Ratio', score: 4 },
      { name: 'Soft Signal Ratio', score: 3 },
    ],
    'Backlog Control Rate': [
      { name: 'Compute', score: 5 },
      { name: 'DevOps', score: 4 },
      { name: 'Security', score: 5 },
      { name: 'GKE', score: 5 },
      { name: 'Networking', score: 5 },
      { name: 'Databases', score: 4 },
      { name: 'Data Analytics', score: 4 },
      { name: 'AI/ML', score: 5 },
      { name: 'Serverless', score: 5 },
      { name: 'Storage', score: 4 },
    ],
  };

  showMissions(missionType: string) {
    this.selectedMission = missionType;

    const modal = document.getElementById('missionModal');
    const missionTitle = document.getElementById('missionTitle');
    const missionList = document.getElementById('missionList');

    if (modal && missionTitle && missionList) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      missionTitle.textContent = missionType;
      missionList.innerHTML = '';
      const missions = this.missionData[missionType] || [];

      missions.forEach((item) => {
        const row = document.createElement('li');
        row.className =
          'flex justify-between items-center bg-gray-50 px-4 py-2 rounded';

        const name = document.createElement('span');
        name.className = 'text-gray-700';
        name.textContent = item.name;

        const score = document.createElement('span');
        score.className = 'text-blue-600 font-semibold';
        score.textContent = item.score.toString();

        row.appendChild(name);
        row.appendChild(score);
        missionList.appendChild(row);
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('missionModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showStatPopup = false;
  popupTitle = '';
  popupContent: string[] = [];

  showPopup(type: string) {
    this.showStatPopup = true;
    this.searchTerm = '';

    const nameIndex = this.headers.findIndex(
      (h) => h?.toLowerCase().trim() === 'name'
    );
    const ratingIndex = this.headers.findIndex(
      (h) => h?.toLowerCase().trim() === 'rating'
    );

    if (nameIndex === -1 || ratingIndex === -1) {
      console.error('Name or Rating column not found. Headers:', this.headers);
      this.popupContent = ['Error: Name/Rating header not found.'];
      this.filteredPopupContent = [...this.popupContent];
      return;
    }

    let filtered: any[] = [];

    switch (type) {
      case 'totalAssociates':
        this.popupTitle = 'Total Associates';
        this.popupContent = this.sheetData
          .map((row) => row[nameIndex])
          .filter((name) => !!name)
          .sort((a: string, b: string) => a.localeCompare(b));
        break;
      case 'topPerformers':
        this.popupTitle = 'Top Performers';
        filtered = this.sheetData.filter(
          (row) => row[ratingIndex] == 5 || row[ratingIndex] == 4
        );
        this.popupContent = filtered
          .map((row) => row[nameIndex])
          .filter((name) => !!name)
          .sort((a: string, b: string) => a.localeCompare(b));
        break;
      case 'averagePerformers':
        this.popupTitle = 'Average Performers';
        filtered = this.sheetData.filter((row) => row[ratingIndex] == 3);
        this.popupContent = filtered
          .map((row) => row[nameIndex])
          .filter((name) => !!name)
          .sort((a: string, b: string) => a.localeCompare(b));
        break;
      case 'bottomPerformers':
        this.popupTitle = 'Bottom Performers';
        filtered = this.sheetData.filter(
          (row) => row[ratingIndex] == 2 || row[ratingIndex] == 1
        );
        this.popupContent = filtered
          .map((row) => row[nameIndex])
          .filter((name) => !!name)
          .sort((a: string, b: string) => a.localeCompare(b));
        break;
    }
    this.filteredPopupContent = [...this.popupContent];
  }
  closePopup() {
    this.showStatPopup = false;
  }
  filterStats(filterType: string) {
    console.log('Filtering stats by:', filterType);
  }

  //my actions
  supportability = [
    'Set up a custom container for model serving',
    'Request for training in GENAI',
    'Review and update support documentation',
  ];
  escalations = [
    'Escalation 1: AI/ML - High Priority',
    'Escalation 2: Serverless - Medium Priority',
    'Escalation 3: Data Analytics - Low Priority',
  ];
  teamGrowthPlan = [
    'Conduct one-on-one meetings with team members',
    'Identify skill gaps and training needs',
    'Set individual performance goals',
  ];

  showActionPopup = false;
  actionPopupTitle = '';
  actionPopupList: string[] = [];

  showActionDetails(type: string) {
    if (type === 'Supportability') {
      this.actionPopupTitle = 'Supportability';
      this.actionPopupList = this.supportability;
    } else if (type === 'Escalations Yet to be Reviewed') {
      this.actionPopupTitle = 'Escalations Yet to be Reviewed';
      this.actionPopupList = this.escalations;
    } else if (type === 'Team Growth Plan') {
      this.actionPopupTitle = 'Team Growth Plan';
      this.actionPopupList = this.teamGrowthPlan;
    }
    this.showActionPopup = true;
  }

  closeActionPopup() {
    this.showActionPopup = false;
  }

  showChatWindow() {
    this.filterService.setAgentButtonVisibility(true);
    this.filterService.setChatWindowOpenVisibility(true)
    this.isShowChatWindow = true;
    this.showAgentButton = true;
    this.showAgent = false;
  }
}
