import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; // Import the module
import {
  Component,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgFor, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatMessage, ChatService } from '../../services/chat.service';
import { FormatMessagePipe } from './format-html.pipe';
import { FilterService } from '../../services/filter.service';
//import { ChatService, ChatMessage } from '../../chat';
@Component({
  selector: 'app-chat-window',
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
    FormatMessagePipe,
  ],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css',
})
export class ChatWindowComponent
  implements AfterViewChecked, OnInit, OnDestroy
{
  @ViewChild('messagesContainer', { static: false })
  private messagesContainer?: ElementRef;
  @Input() userId?: number;
  @Output() closed = new EventEmitter<void>(); // <-- new output
  @Output() close = new EventEmitter<void>(); // The Angular FormGroup instance
  feedbackForm!: FormGroup; // State to manage visibility (optional, can be managed by parent)
  isSubmitting = false;
  showSuccessMessage = false;
  isVisible: boolean = false;
  text = '';
  isOpen = true;
  isShowChatWindow = true;
  showHint = true;
  chatHistory: ChatMessage[] = [];
  selectedRating: number = 0;
  private readonly idleTimeoutMs = 420_000; // 7 minute
  private idleTimer?: ReturnType<typeof setTimeout>;
  private lastActivity = 0;
  private subscriptions = new Subscription();
  selectedSite: string | undefined;
  constructor(
    public chat: ChatService,
    private filterService: FilterService,
    private fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.filterService.showAgentButton$.subscribe((visible) => {
      // this.clear();
      if (!visible) {
        this.clear();
      }
    });

    this.filterService.currentSite.subscribe(async (site) => {
      this.selectedSite = site;

      if (this.selectedSite == 'Select') {
        this.selectedSite = 'ALL';
      } else {
        this.selectedSite = this.selectedSite;
      }
    });

    const messagesSub = this.chat.messages$.subscribe((msgs) => {
      if (msgs && msgs.length > 0) {
        this.showHint = false; // hide hint on first message
        this.chatHistory = msgs;
      }
      this.onUserActivity();
    });
    this.subscriptions.add(messagesSub);
    const sessionSub = this.chat.getSessions().subscribe((response: any) => {
      if (response?.session_id) {
        this.chat.connect(response.session_id, this.selectedSite);
      }
    });
    this.subscriptions.add(sessionSub);

    if (this.isShowChatWindow) {
      this.onUserActivity();
    }
    this.initForm();
  } // 1. Initialize the form with Reactive Forms
  initForm(): void {
    this.feedbackForm = this.fb.group({
      // The 'feedbackText' control is required (must not be empty)
      feedbackText: ['', [Validators.required, Validators.minLength(5)]],
      rating: [0, [Validators.required, Validators.min(1)]],
    });
  }
  setRating(rating: number): void {
    this.selectedRating = rating; // Update the form control value
    this.feedbackForm.controls['rating'].setValue(rating); // Manually mark the rating control as touched if needed for validation visibility
    this.feedbackForm.controls['rating'].markAsDirty();
    this.feedbackForm.controls['rating'].markAsTouched();
  }
  ngOnDestroy(): void {
    this.clearIdleTimer();
    this.subscriptions.unsubscribe();
  }
  send() {
    if (!this.text.trim()) return;
    this.chat.sendMessage(this.text);
    this.text = '';
    this.onUserActivity(); // reset timer on send
  }
  showChatWindow() {
    this.text = '';
    this.isShowChatWindow = true;
    this.isOpen = true;
    this.showHint = true;
    this.onUserActivity(); // start/reset timer when opened
  }
  clear() {
    this.chat.clear();
    this.isShowChatWindow = false;
    this.clearIdleTimer();
    this.showHint = true;
    this.closed.emit();
  }
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isShowChatWindow) {
      this.onUserActivity();
    } else {
      this.clearIdleTimer();
    }
  } // call from template (input) and other user actions
  onUserActivity() {
    if (!this.isShowChatWindow) return;
    this.resetIdleTimer();
  }
  private resetIdleTimer() {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => this.handleIdle(), this.idleTimeoutMs);
  }

  private handleIdle() {
    this.isShowChatWindow = false;
    this.chat.clear();
    this.clearIdleTimer();
    this.closed.emit();
  }
  private clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
  ngAfterViewChecked(): void {
    if (this.messagesContainer) {
      try {
        const el: HTMLElement = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch {}
    }
  }
  trackByIndex(_: number, __: ChatMessage) {
    return _;
  }

  /**
   * Returns an object of CSS classes to apply dynamically to agent messages.
   * This allows for different styling based on content (e.g., code blocks, lists).
   * @param message The chat message to evaluate.
   */
  getAgentMessageDynamicClasses(message: ChatMessage): {
    [key: string]: boolean;
  } {
    const classes: { [key: string]: boolean } = {};
    if (message.from === 'bot') {
      if (message.text.includes('```')) {
        classes['agent-code-block'] = true;
      }
    }
    return classes;
  }

  onSubmit(): void {
    if (this.feedbackForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const feedbackData = this.feedbackForm.value;
      const payload = {
        session_id: this.chat.currentSessionId,
        feedback_type: `${feedbackData.rating}_stars`,
        comment: feedbackData.feedbackText,
        conversation: this.chatHistory.map((msg) => ({
          role: msg.from,
          text: msg.text,
        })),
      };

      this.chat.sendFeedback(payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.showSuccessMessage = true;
          setTimeout(() => {
            this.closePopup();
            this.chat.clear(); // Clear chat history on submit
            this.isShowChatWindow = false;
            this.closed.emit();
          }, 2000); // Close after 2 seconds
        },
        error: (error) => {
          this.isSubmitting = false;
        },
      });
    }
  } // 3. Methods to control the pop-up
  openPopup(): void {
    this.isVisible = true;
  }
  closePopup(): void {
    this.isVisible = false;
    this.close.emit(); // Notify parent to close
    this.showSuccessMessage = false;
    this.isSubmitting = false;
    this.feedbackForm.reset(); // Clear the form on close
    this.selectedRating = 0;
  }
}
