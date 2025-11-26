import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CesDataService {
  private apiUrl = 'http://localhost:3000/api/ces-data';

  constructor(private http: HttpClient) {}

  getCesData(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}