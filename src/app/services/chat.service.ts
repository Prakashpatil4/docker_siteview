import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable, Subject, take } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

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

   // DEV API URL
  private readonly chatAPIURL = API_ENDPOINTS.DEV_BASE_URL;
  private readonly WS_URL = API_ENDPOINTS.DEV_WS_URL

  // UAT API URL
  // private readonly chatAPIURL = API_ENDPOINTS.UAT_BASE_URL;
  // private readonly WS_URL = API_ENDPOINTS.UAT_WS_URL



  private sessionId: string | null = null;
  private socket$?: WebSocketSubject<any>;
  startDate: string | undefined;
  endDate: string | undefined;
  ownerTeam: string | undefined;
  businessLine: string | undefined;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Getter for the current active session ID.
   */
  public get currentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Getter for the currently applied session filters.
  */

  public get currentFilters(): SessionFilters {
    return this.filtersSubject.value;
  }

  /**
   * Makes an HTTP POST request to initialize a new chat session with specified filters.
  */

  createSession(
    ownerTeam?: string,
    businessLine?: string,
    startDate?: string,
    endDate?: string,
  ): Observable<SessionCreateResponse> {
    const userData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    const apiUrl = `${this.chatAPIURL}/sessions?owner_team=${ownerTeam}&start_date=${startDate}&end_date=${endDate}&business_line=${businessLine}`;
    const body: SessionCreateRequest = {
      user_id: userData.email,
    };

    if (ownerTeam) body.owner_team = ownerTeam;
    if (businessLine) body.business_line = businessLine;
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;
    return this.http.post<SessionCreateResponse>(apiUrl, body);
  }

  /**
   * Wrapper for createSession that stores local filter state before initializing the session.
  */

  getSessions(
    startDate?: string,
    endDate?: string,
    ownerTeam?: string,
    businessLine?: string,
  ): Observable<SessionCreateResponse> {
    this.startDate = startDate;
    this.endDate = endDate;
    this.ownerTeam = ownerTeam;
    this.businessLine = businessLine;
    return this.createSession(ownerTeam, businessLine, startDate, endDate);
  }

   /**
   * Establishes a WebSocket connection using the session ID and current filter parameters.
   * Handles incoming message types such as 'typing', 'progress', 'message', and 'updated_filters'.
   */

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
    const wsUrl = `${this.WS_URL}/${this.sessionId}?owner_team=${this.ownerTeam}&start_date=${this.startDate}&end_date=${this.endDate}&business_line=${this.businessLine}`;
    this.socket$ = new WebSocketSubject(wsUrl);

    this.socket$.subscribe(
      (msg: any) => {
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
              msg.args,
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

          case 'updated_filters':
            console.log('Filter update response:', msg);
            this.loadingSubject.next(true);
            if (msg.context) {
              this.filtersSubject.next(msg.context);
            }
            if (msg.message || msg.response) {
              this.addBotMessage(msg.message || msg.response, true);
            }

            this.filterUpdateSubject.next({
              type: 'filters_updated',
              success: msg.success,
              message: msg.message,
              context: msg.context,
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
      },
    );
  }

  /**
   * Sends a user message to the WebSocket server and updates the local message history.
   */

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

  /**
   * Sends a filter update command over the WebSocket. If the socket is not yet open,
   * it queues the update until the connection is established.
   */

  updateFilters(filters: Partial<SessionFilters>): void {
    // 1. Check if the socket is truly ready
    if (!this.socket$ || this.socket$.closed) {
      console.warn('Socket not ready. Queuing filters...');

      this.loadingSubject.next(true);

      // 2. Wait for the FIRST successful connection message
      // We listen to filters$ because your connect() method calls .next() on 'connected'
      this.filters$
        .pipe(
          filter((ctx) => Object.keys(ctx).length > 0), // Wait until context exists
          take(1), // Execute only once then unsubscribe
        )
        .subscribe(() => {
          console.log('Socket now ready! Sending queued filters:', filters);
          this.socket$?.next({
            type: 'update_filters',
            filters: filters,
          });
        });
      return;
    }

    // 3. Normal flow if already connected
    this.loadingSubject.next(true);
    this.socket$.next({
      type: 'update_filters',
      filters: filters,
    });
  }

  /**
   * Submits user feedback (ratings/comments) for the current chat session via HTTP POST.
  */

  sendFeedback(payload: any): Observable<any> {
    const apiUrl = `${this.chatAPIURL}/feedback`;
    return this.http.post(apiUrl, payload);
  }

  /**
   * Closes the WebSocket connection and resets all local session-related state.
  */

  clear() {
    this.socket$?.complete();
    this.socket$ = undefined;
    this.messagesSubject.next([]);
    this.filtersSubject.next({});
    this.sessionId = null;
  }

  /**
   * Internal helper to add a bot's response to the message history and handle loading states.
  */

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
