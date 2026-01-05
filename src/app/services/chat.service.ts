import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  time: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private storageKey = 'currentUser';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();
  private chatAPIURL =
    'https://e360-siteops-bot-v2-dot-digital-sme.uc.r.appspot.com/';

  private sessionId: string | null = null;
  private socket$?: WebSocketSubject<any>;

  constructor(private http: HttpClient, private authService: AuthService) {}

  public get currentSessionId(): string | null {
    return this.sessionId;
  }

  getSessions(): Observable<any> {
    const userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');

    const apiUrl = `${this.chatAPIURL}/sessions`;

    const body = { user_id: 'oladri@google.com' };
    //const body = { userid: userData.email, role: userData.role };

    return this.http.post<any>(apiUrl, body);
  }

  sendMessage(text: string) {
    const trimmed = text?.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      from: 'user',
      text: text.trim(),
      time: Date.now(),
    };
    this.messagesSubject.next([...this.messagesSubject.value, userMsg]);

    if (this.socket$) {
      this.socket$.next({ message: trimmed });
    } else {
      console.error('WebSocket is not connected.');
      this.addBotMessage('Error: Not connected to the server.', false);
    }
  }

  sendFeedback(payload: any): Observable<any> {
    const apiUrl =
      'https://e360-bot-mvp-dot-digital-sme.uc.r.appspot.com/feedback';
    return this.http.post(apiUrl, payload);
  }

  clear() {
    this.socket$?.complete(); // Close the WebSocket connection
    this.socket$ = undefined;
    this.messagesSubject.next([]);
    this.sessionId = null;
  }

  connect(sessionId: string, selectedSite: any): void {
    console.log('selected site-->' + selectedSite);
    if (this.socket$ && !this.socket$.closed) {
      return; // Already connected
    }
    this.sessionId = sessionId;

    if (!this.sessionId) {
      console.error('No session ID to connect to WebSocket');
      return;
    }

    // --- FIX 1: Corrected syntax with backticks (`) --- e360-bot-mvp-dot-digital-sme.uc.r.appspot.com
    const wsUrl = `wss://e360-siteops-bot-dot-digital-sme.uc.r.appspot.com/ws/${this.sessionId}?owner_team=${selectedSite}`;

    this.socket$ = new WebSocketSubject(wsUrl);
    console.log('socket-->' + JSON.stringify(this.socket$));
    // --- FIX 2: Added full message handling logic ---
    this.socket$.subscribe(
      (msg: any) => {
        console.log('Server Message:', msg); // Good for debugging

        // Use a switch to handle all message types from the backend
        switch (msg.type) {
          case 'connected':
            // This is the first message. Show "Connected as SITEOPS"
            // this.addBotMessage(msg.message, false);
            break;

          case 'typing':
            // The bot is thinking. Show the "..." indicator.
            this.loadingSubject.next(true);
            break;

          case 'progress':
            // The bot is using a tool. Log it to the console.
            console.log(
              `TOOL: ${msg.tool}, STATUS: ${msg.status}, ARGS:`,
              msg.args
            );
            // This is where you would update the "Execution Details" timeline in your UI
            break;

          case 'message':
            // This is the FINAL bot answer.
            // The key is 'response', not 'message'
            this.addBotMessage(msg.response, true);
            break;

          case 'error':
            // The bot had an error.
            this.addBotMessage(`Sorry, an error occurred: ${msg.error}`, true);
            break;

          default:
            // Fallback for any other message
            if (msg.message) {
              this.addBotMessage(msg.message, true);
            }
        }
      },
      (err: any) => {
        // Catches errors and unexpected closures
        console.error('WebSocket error:', err);
        const errMsg = err.wasClean
          ? 'Connection closed.'
          : 'Sorry, the connection was lost unexpectedly.';
        //this.addBotMessage(errMsg, true);
        if (!err.wasClean) {
          // this.addBotMessage("Sorry, the connection was lost unexpectedly.", true);
        }
      },
      () => {
        // WebSocket connection is fully closed
        this.loadingSubject.next(false);
        //this.addBotMessage("Connection closed.", false);
        console.log('WebSocket connection closed');
      }
    );
  }

  /**
   * Helper function to add a bot message to the chat history
   */
  private addBotMessage(text: string, stopLoading: boolean) {
    if (stopLoading) {
      this.loadingSubject.next(false);
    }

    if (!text) return; // Don't add empty messages

    const botMsg: ChatMessage = {
      from: 'bot',
      text: text,
      time: Date.now(),
    };
    this.messagesSubject.next([...this.messagesSubject.value, botMsg]);
  }

  // --- FIX 3: Removed the 'fakeReply' function ---
  // This was test code and was preventing the real messages from being handled.
}
