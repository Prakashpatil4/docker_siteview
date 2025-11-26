import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-popup-modal',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './popup-modal.component.html',
  styleUrls: ['./popup-modal.component.css']
})
export class PopupModalComponent {
  @Input() title: string = '';
  @Input() content: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Input() showViewMore: boolean = false;
@Output() viewMore = new EventEmitter<void>();

  closePopup() {
    this.close.emit();
  }
}