import { Component, ElementRef, HostListener } from "@angular/core";
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
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, MatDatepickerModule,NotificationsComponent,
    MatFormFieldModule, MatInputModule, MatNativeDateModule, MatOptionModule, MatSelectModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  selectedSite: string = 'Select';

  selectedBusinessline: string = 'Select';

  constructor(private filterService: FilterService, private eRef: ElementRef) {}

  onSiteChange(): void {
    console.log(`HEADER: Sending site to service: '${this.selectedSite}'`);
    this.filterService.setSite(this.selectedSite);
  }

  onBusinessLineChange() {

    console.log(`HEADER: Sending business line to service: '${this.selectedBusinessline}'`);

    this.filterService.setBusinessLine(this.selectedBusinessline);
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
