// FILE: src/app/filter.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat.service';
@Injectable({
  providedIn: 'root',
})
export class FilterService {
  // Business Line
  private businessLineSource = new BehaviorSubject<string>('Select');
  currentBusinessLine = this.businessLineSource.asObservable();
  private siteSource = new BehaviorSubject<string>('Select');
  currentSite = this.siteSource.asObservable();

  private dateRangeSource = new BehaviorSubject<string>('Select');
  currentDateRange = this.dateRangeSource.asObservable();

  private agentButtonVisibility = new BehaviorSubject<boolean>(true);

  // Observable for components to subscribe to
  showAgentButton$ = this.agentButtonVisibility.asObservable();

  private chatWindowOpenVisibility = new BehaviorSubject<boolean>(false);

  // Observable for components to subscribe to
  isChatWindowOpen$ = this.chatWindowOpenVisibility.asObservable();

  constructor(private chat: ChatService) {}

  setBusinessLine(businessLine: string) {
    this.businessLineSource.next(businessLine);
  }
  setSite(site: string) {
    this.siteSource.next(site);
  }
  setDateRange(startDate: string, endDate: string) {
    this.dateRangeSource.next(startDate + ' , ' + endDate);
  }
  setAgentButtonVisibility(visible: boolean) {
    this.agentButtonVisibility.next(visible);
  }
  setChatWindowOpenVisibility(visible: boolean) {
    this.chatWindowOpenVisibility.next(visible);
  }
  get isAgentButtonVisible(): boolean {
  return this.chatWindowOpenVisibility.value;
}
  connectWithAgent() {




    const currentSite =
      this.siteSource.value === 'Select' || !this.siteSource.value
        ? 'ALL'
        : this.siteSource.value;
    const currentBusinessLine =
      this.businessLineSource.value === 'Select' ||
      !this.businessLineSource.value
        ? 'ALL'
        : this.businessLineSource.value;
    const currentDateRange = this.dateRangeSource.value;

    // 2. Clean Data Extraction
    const dates = (currentDateRange || '').split(',');
    const startDate = (dates[0] || '').trim();
    const endDate = (dates[1] || '').trim();



   this.chat.updateFilters({
      owner_team: currentSite,
      business_line: currentBusinessLine,
      timeframe_start: startDate,
      timeframe_end: endDate
    });


    // this.chat
    //   .getSessions(
    //     startDate ?? '',
    //     endDate ?? '',
    //     currentSite ?? '',
    //     currentBusinessLine ?? '',
    //   )
    //   .subscribe((response: any) => {
    //     if (response?.session_id) {
    //       this.chat.connect(
    //         startDate ?? '',
    //         endDate ?? '',
    //         response.session_id,
    //         currentSite,
    //         currentBusinessLine ?? '',
    //       );
    //     }
    //   });
  }
}
