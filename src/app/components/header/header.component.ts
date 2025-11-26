import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { HttpClient } from '@angular/common/http';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FilterService } from '../../services/filter.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, MatDatepickerModule,
    MatFormFieldModule, MatInputModule, MatNativeDateModule, MatOptionModule, MatSelectModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  selectedSite: string = 'Select';
  
  selectedBusinessline: string = 'Select';
  

  constructor(private filterService: FilterService) {}
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

  toggleNotification(): void {
    this.showNotification = !this.showNotification;
  }
  
}