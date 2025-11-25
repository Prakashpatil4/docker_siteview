import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

export interface NotificationItem {
  userId: number;
  id: number;
  title: string;
  body: string;
  time?: number;
}

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly url = "https://jsonplaceholder.typicode.com/posts";

  constructor(private http: HttpClient) {}

  async fetchFirstN(n = 7): Promise<NotificationItem[]> {
    const arr = await firstValueFrom(
      this.http.get<NotificationItem[]>(this.url)
    );
    return (arr || []).slice(0, n).map((it) => ({ ...it, time: Date.now() }));
  }
}
