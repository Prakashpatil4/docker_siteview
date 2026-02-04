// import { Injectable } from '@angular/core';
// import {
//   BehaviorSubject,
//   EMPTY,
//   Observable,
//   Subject,
//   Subscription,
//   timer,
// } from 'rxjs';
// import { catchError, switchMap, tap } from 'rxjs/operators';
// import { WebSocketSubject } from 'rxjs/webSocket';
// import { HttpClient } from '@angular/common/http';
// import { AuthService } from './auth.service';

// export interface ChatMessage {
//   from: 'user' | 'bot';
//   text: string;
//   time: number;
// }

// @Injectable({ providedIn: 'root' })
// export class ChatService {
//   private socketSubscription?: any;
//   private storageKey = 'currentUser';
//   private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
//   readonly messages$ = this.messagesSubject.asObservable();
//   private loadingSubject = new BehaviorSubject<boolean>(false);
//   readonly loading$ = this.loadingSubject.asObservable();
//   private chatAPIURL =
//     'https://e360-siteops-bot-v2-dot-digital-sme.uc.r.appspot.com';
//   private readonly BASE_URL =
//     'wss://e360-siteops-bot-v2-dot-digital-sme.uc.r.appspot.com/ws';

//   //   private chatAPIURL =
//   //   'https://e360-siteops-bot-dev-dot-digital-sme.uc.r.appspot.com';
//   // private readonly BASE_URL = 'wss://e360-siteops-bot-dev-dot-digital-sme.uc.r.appspot.com/ws';

//   private sessionId: string | null = null;
//   private socket$?: WebSocketSubject<any>;

//   private connectionRequest$ = new Subject<string>();

//   constructor(
//     private http: HttpClient,
//     private authService: AuthService,
//   ) {
//     // This is the ONLY place where subscriptions are managed
//     this.connectionRequest$
//       .pipe(
//         // switchMap is the magic: it automatically unsubscribes/cancels
//         // the previous connection if a new URL comes in.
//         switchMap((url) => {
//           this.cleanup();
//           // 300ms debounce to ensure the browser has time to clear the socket
//           return timer(300).pipe(tap(() => this.establishConnection(url)));
//         }),
//       )
//       .subscribe();
//   }

//   // 1. Modified connect: It just builds the URL and pushes to the stream
//   connect(
//     startDate: string,
//     endDate: string,
//     sessionId: string,
//     site: any,
//     businessLine: string,
//   ): void {
//     if (!sessionId) {
//       console.error('❌ No session ID to connect to WebSocket');
//       return;
//     }

//     // const query = new URLSearchParams({
//     //   owner_team: site || 'ALL',
//     //   start_date: startDate,
//     //   end_date: endDate,
//     //   business_line: 'ALL', // Or pass bl
//     // }).toString();

//     // const wsUrl = `${this.BASE_URL}/${sessionId}?${query}`;
//     const wsUrl = `${this.BASE_URL}/${this.sessionId}?owner_team=${site}&start_date=${startDate}&end_date=${endDate}&business_line=${businessLine}`;

//     // Trigger the queue
//     this.connectionRequest$.next(wsUrl);
//   }

//   private establishConnection(url: string) {
//     console.log('🚀 Establishing Connection to:', url);
//     // this.loadingSubject.next(true);

//     this.socket$ = new WebSocketSubject({
//       url: url,
//       // Prevents the "closed before established" error by ensuring
//       // the browser has a clean slate
//       openObserver: {
//         next: () => console.log('✅ Connected to Server'),
//       },
//       closeObserver: {
//         next: () => {
//           console.log('⚠️ Connection Closed');
//           this.loadingSubject.next(false);
//         },
//       },
//     });

//     this.socketSubscription = this.socket$.subscribe({
//       next: (msg) => this.handleSocketMessages(msg),
//       error: (err) => {
//         console.error('❌ WebSocket Error Callback:', err);
//         this.loadingSubject.next(false);
//       },
//     });
//   }

//   private cleanup() {
//     console.log('🧹 Performing Cleanup...');
//     if (this.socketSubscription) {
//       this.socketSubscription.unsubscribe();
//       this.socketSubscription = undefined;
//     }
//     if (this.socket$) {
//       this.socket$.complete();
//       this.socket$ = undefined;
//     }
//   }

//   public get currentSessionId(): string | null {
//     return this.sessionId;
//   }

//   getSessions(
//     startDate: string,
//     endDate: string,
//     site: string,
//     businessLine: string,
//   ): Observable<any> {
//     const userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
//     const apiUrl = `${this.chatAPIURL}/sessions?owner_team=${site}&start_date=${startDate}&end_date=${endDate}&business_line=${businessLine}`;
//     const body = { user_id: userData.email };

//     return this.http.post<any>(apiUrl, body).pipe(
//       tap((response) => {
//         // Logic to extract ID from the whole response
//         if (response && response.length > 0) {
//           // Assuming response is an array, taking the first one
//           this.sessionId = response[0].session_id;
//         } else if (response && response.session_id) {
//           // Assuming response is a single object
//           this.sessionId = response.session_id;
//         }
//         console.log('Session ID captured in service:', this.currentSessionId);
//       }),
//     );
//   }

//   // getSessions(startDate:string,endDate:string,site: string, businessLine: string): Observable<any> {
//   //   const userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
//   //   const apiUrl = `${this.chatAPIURL}/sessions?owner_team=${site}&start_date=${startDate}&end_date=${endDate}&business_line=${businessLine}`;

//   //   const body = { user_id: userData.email };
//   //   //const body = { userid: userData.email, role: userData.role };

//   //   return this.http.post<any>(apiUrl, body);
//   // }

//   sendMessage(text: string) {
//     const trimmed = text?.trim();
//     if (!trimmed) return;

//     const userMsg: ChatMessage = {
//       from: 'user',
//       text: text.trim(),
//       time: Date.now(),
//     };
//     this.messagesSubject.next([...this.messagesSubject.value, userMsg]);

//     if (this.socket$) {
//       this.socket$.next({ message: trimmed });
//     } else {
//       console.error('WebSocket is not connected.');
//       this.addBotMessage('Error: Not connected to the server.', false);
//     }
//   }

//   sendFeedback(payload: any): Observable<any> {
//     const apiUrl = `${this.chatAPIURL}/feedback`;
//     return this.http.post(apiUrl, payload);
//   }

//   clear() {
//     this.socket$?.complete(); // Close the WebSocket connection
//     this.socket$ = undefined;
//     this.messagesSubject.next([]);
//     this.sessionId = null;
//   }

//   private handleSocketMessages(msg: any): void {
//     // 1. Centralized logging for easier debugging
//     console.log('📩 Incoming Server Message:', msg);

//     // 2. Clear loading state unless the message type explicitly requires it (like 'typing')
//     if (msg.type !== 'typing') {
//       this.loadingSubject.next(false);
//     }

//     // 3. Handle specific message types
//     switch (msg.type) {
//       case 'connected':
//         console.log('System: Handshake successful.');
//         break;

//       case 'typing':
//         // Show the "Bot is thinking..." animation
//         this.loadingSubject.next(true);
//         break;

//       case 'progress':
//         // Handle tool execution or background tasks
//         console.log(`🛠️ Tool: ${msg.tool} | Status: ${msg.status}`);
//         // If you have a progress bar, update it here
//         this.loadingSubject.next(true);
//         break;

//       case 'message':
//         // The final LLM response
//         if (msg.response) {
//           this.addBotMessage(msg.response, true);
//         }
//         break;

//       case 'error':
//         // Server-side logic errors (e.g., API keys, database down)
//         const errorText = msg.error || 'A server-side error occurred.';
//         this.addBotMessage(`⚠️ ${errorText}`, true);
//         break;

//       default:
//         // Catch-all for basic string messages or unmapped types
//         const fallback = msg.message || msg.text;
//         if (fallback) {
//           this.addBotMessage(fallback, true);
//         }
//         break;
//     }
//   }

//   // connect(startDate:string, endDate: string,sessionId: string, selectedSite: any,businessLine: string): void {

//   //   // if (this.socket$ && !this.socket$.closed) {
//   //   //   return; // Already connected
//   //   // }
//   //   this.sessionId = sessionId;

//   //   if (!this.sessionId) {
//   //     console.error('No session ID to connect to WebSocket');
//   //     return;
//   //   }

//   //   //const wsUrl = `{{this.BASE_URL}}/ws/${this.sessionId}?owner_team=${selectedSite}`;
//   //   const wsUrl = `${this.BASE_URL}/${this.sessionId}?owner_team=${selectedSite}&start_date=${startDate}&end_date=${endDate}&business_line=ALL`;
//   //   this.socket$ = new WebSocketSubject(wsUrl);
//   //   console.log('socket-->' + JSON.stringify(this.socket$));
//   //   console.log('this.socket$.closed--->'+this.socket$.closed)
//   //   // --- FIX 2: Added full message handling logic ---
//   //   this.socket$.subscribe(
//   //     (msg: any) => {
//   //       console.log('Server Message:', msg); // Good for debugging

//   //       // Use a switch to handle all message types from the backend
//   //       switch (msg.type) {
//   //         case 'connected':
//   //           // This is the first message. Show "Connected as SITEOPS"
//   //           // this.addBotMessage(msg.message, false);
//   //           break;

//   //         case 'typing':
//   //           // The bot is thinking. Show the "..." indicator.
//   //           this.loadingSubject.next(true);
//   //           break;

//   //         case 'progress':
//   //           // The bot is using a tool. Log it to the console.
//   //           console.log(
//   //             `TOOL: ${msg.tool}, STATUS: ${msg.status}, ARGS:`,
//   //             msg.args
//   //           );
//   //           // This is where you would update the "Execution Details" timeline in your UI
//   //           break;

//   //         case 'message':
//   //           // This is the FINAL bot answer.
//   //           // The key is 'response', not 'message'
//   //           this.addBotMessage(msg.response, true);
//   //           break;

//   //         case 'error':
//   //           // The bot had an error.
//   //           this.addBotMessage(`Sorry, an error occurred: ${msg.error}`, true);
//   //           break;

//   //         default:
//   //           // Fallback for any other message
//   //           if (msg.message) {
//   //             this.addBotMessage(msg.message, true);
//   //           }
//   //       }
//   //     },
//   //     (err: any) => {
//   //       // Catches errors and unexpected closures
//   //       console.error('WebSocket error:', err);
//   //       const errMsg = err.wasClean
//   //         ? 'Connection closed.'
//   //         : 'Sorry, the connection was lost unexpectedly.';
//   //       //this.addBotMessage(errMsg, true);
//   //       if (!err.wasClean) {
//   //         // this.addBotMessage("Sorry, the connection was lost unexpectedly.", true);
//   //       }
//   //     },
//   //     () => {
//   //       // WebSocket connection is fully closed
//   //       this.loadingSubject.next(false);
//   //       //this.addBotMessage("Connection closed.", false);
//   //       console.log('WebSocket connection closed');
//   //     }
//   //   );
//   // }

//   /**
//    * Helper function to add a bot message to the chat history
//    */
//   private addBotMessage(text: string, stopLoading: boolean) {
//     if (stopLoading) {
//       this.loadingSubject.next(false);
//     }

//     if (!text) return; // Don't add empty messages

//     const botMsg: ChatMessage = {
//       from: 'bot',
//       text: text,
//       time: Date.now(),
//     };
//     this.messagesSubject.next([...this.messagesSubject.value, botMsg]);
//   }
// }



// New code 30 jan


 import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  time: number;
}

// =====================================================
// Filter interfaces
// =====================================================
export interface SessionFilters {
  owner_team?: string;
  business_line?: string;
  timeframe_start?: string;
  timeframe_end?: string;
  display_name?: string;
}

export interface FilterUpdateResponse {
  type: 'filters_updated';
  success: boolean;
  message: string;
  context?: SessionFilters;
}

// =====================================================
// Session Creation interfaces (matches backend)
// =====================================================
export interface SessionCreateRequest {
  user_id: string;
  owner_team?: string;
  business_line?: string;
  start_date?: string;
  end_date?: string;
}

export interface SessionCreateResponse {
  session_id: string;
  user_id: string;
  display_name: string;
  persona: string;
  owner_team: string;
  business_line: string;
  timeframe_start: string;
  timeframe_end: string;
  created_at: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private storageKey = 'currentUser';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  // =====================================================
  // Filter state management
  // =====================================================
  private filtersSubject = new BehaviorSubject<SessionFilters>({});
  readonly filters$ = this.filtersSubject.asObservable();

  private filterUpdateSubject = new Subject<FilterUpdateResponse>();
  readonly filterUpdate$ = this.filterUpdateSubject.asObservable();

  // private chatAPIURL =
  //   'https://e360-siteops-bot-v2-dot-digital-sme.uc.r.appspot.com';
  // private readonly BASE_URL = 'wss://e360-siteops-bot-v2-dot-digital-sme.uc.r.appspot.com/ws';


   private chatAPIURL =
      'https://e360-siteops-bot-dev-dot-digital-sme.uc.r.appspot.com';
   private readonly BASE_URL = 'wss://e360-siteops-bot-dev-dot-digital-sme.uc.r.appspot.com/ws';




  private sessionId: string | null = null;
  private socket$?: WebSocketSubject<any>;
  startDate: string | undefined;
  endDate: string | undefined;
  ownerTeam: string | undefined;
  businessLine: string | undefined;

  constructor(private http: HttpClient, private authService: AuthService) {}

  public get currentSessionId(): string | null {
    return this.sessionId;
  }

  public get currentFilters(): SessionFilters {
    return this.filtersSubject.value;
  }

  // =====================================================
  // 1. CREATE SESSION (with initial filters)
  // =====================================================
  createSession(
    ownerTeam?: string,
    businessLine?: string,
    startDate?: string,
    endDate?: string
  ): Observable<SessionCreateResponse> {
    const userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
   // const apiUrl = `${this.chatAPIURL}/sessions`;
    const apiUrl = `${this.chatAPIURL}/sessions?owner_team=${ownerTeam}&start_date=${startDate}&end_date=${endDate}&business_line=${businessLine}`;

    // Build request body with filters
    const body: SessionCreateRequest = {
      user_id: userData.email,
    };

    // Add optional filter parameters
    if (ownerTeam) body.owner_team = ownerTeam;
    if (businessLine) body.business_line = businessLine;
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;

    console.log('Creating session with:', body);

    return this.http.post<SessionCreateResponse>(apiUrl, body);
  }

  // Legacy method name (calls createSession)
  getSessions(
    startDate?: string,
    endDate?: string,
    ownerTeam?: string,
    businessLine?: string,
  ): Observable<SessionCreateResponse> {
    this.startDate =startDate;
    this.endDate =endDate;
    this.ownerTeam =ownerTeam;
    this.businessLine =businessLine;
    return this.createSession(ownerTeam, businessLine, startDate, endDate);
  }

  // =====================================================
  // 2. CONNECT WEBSOCKET
  // =====================================================
  connect(sessionId: string): void {
    if (this.socket$ && !this.socket$.closed) {
      return; // Already connected
    }
    this.sessionId = sessionId;

    if (!this.sessionId) {
      console.error('No session ID to connect to WebSocket');
      return;
    }

    // Simple WebSocket URL - filters already set during session creation
    const wsUrl = `${this.BASE_URL}/${this.sessionId}?owner_team=${this.ownerTeam}&start_date=${this.startDate}&end_date=${this.endDate}&business_line=${this.businessLine}}`;

    console.log('WebSocket connecting to:', wsUrl);

    this.socket$ = new WebSocketSubject(wsUrl);

    this.socket$.subscribe(
      (msg: any) => {
        console.log('Server Message:', msg);

        switch (msg.type) {
          case 'connected':
            // Store initial filters from connection
            if (msg.context) {
              console.log('Initial context received:', msg.context);
              this.filtersSubject.next(msg.context);
            }
            break;

          case 'typing':
            this.loadingSubject.next(true);
            break;

          case 'progress':
            this.loadingSubject.next(true);
            console.log(
              `TOOL: ${msg.tool}, STATUS: ${msg.status}, ARGS:`,
              msg.args
            );
            break;

          case 'message':
            this.addBotMessage(msg.response, true);
            // Update filters if context changed
            if (msg.context) {
              this.filtersSubject.next(msg.context);
            }
            break;

          case 'error':
            this.addBotMessage(`Sorry, an error occurred: ${msg.error}`, true);
            break;

          // =====================================================
          // Handle filter update response (from WebSocket)
          // =====================================================
          case 'filters_updated':
            console.log('Filter update response:', msg);

            if (msg.success && msg.context) {
              this.filtersSubject.next(msg.context);
            }

            this.filterUpdateSubject.next({
              type: 'filters_updated',
              success: msg.success,
              message: msg.message,
              context: msg.context
            });
            break;

          default:
            if (msg.message) {
              this.addBotMessage(msg.message, true);
            }
        }
      },
      (err: any) => {
        console.error('WebSocket error:', err);
      },
      () => {
        this.loadingSubject.next(false);
        console.log('WebSocket connection closed');
      }
    );
  }

  // =====================================================
  // 3. SEND CHAT MESSAGE
  // =====================================================
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

  // =====================================================
  // 4. UPDATE FILTERS (via WebSocket - after session created)
  // =====================================================
  updateFilters(filters: Partial<SessionFilters>): void {
    console.log('Updating filters:', filters);

    if (!this.socket$ || this.socket$.closed) {
      console.error('WebSocket is not connected. Cannot update filters.');
      this.filterUpdateSubject.next({
        type: 'filters_updated',
        success: false,
        message: 'WebSocket not connected'
      });
      return;
    }

    console.log('Sending filter update via WebSocket:', filters);

    this.socket$.next({
      type: 'update_filters',
      filters: filters
    });
  }

  // =====================================================
  // 5. SEND FEEDBACK
  // =====================================================
  sendFeedback(payload: any): Observable<any> {
    const apiUrl = `${this.chatAPIURL}/feedback`;
    return this.http.post(apiUrl, payload);
  }

  // =====================================================
  // 6. CLEAR SESSION
  // =====================================================
  clear() {
    this.socket$?.complete();
    this.socket$ = undefined;
    this.messagesSubject.next([]);
    this.filtersSubject.next({});
    this.sessionId = null;
  }

  // =====================================================
  // Private helper
  // =====================================================
  private addBotMessage(text: string, stopLoading: boolean) {
    if (stopLoading) {
      this.loadingSubject.next(false);
    }

    if (!text) return;

    const botMsg: ChatMessage = {
      from: 'bot',
      text: text,
      time: Date.now(),
    };
    this.messagesSubject.next([...this.messagesSubject.value, botMsg]);
  }
}
