import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-main-view',
  imports: [CommonModule, HeaderComponent, DashboardComponent],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.css'
})
export class MainViewComponent {

}
