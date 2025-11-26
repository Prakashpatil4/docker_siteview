// FILE: src/app/filter.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
   // Business Line
  private businessLineSource = new BehaviorSubject<string>('Select');
  currentBusinessLine = this.businessLineSource.asObservable();
  private siteSource = new BehaviorSubject<string>('Select');
  currentSite = this.siteSource.asObservable();

  constructor() { }

  setBusinessLine(businessLine: string) {
    this.businessLineSource.next(businessLine);
  }
  setSite(site: string) {
    this.siteSource.next(site);
  }
}