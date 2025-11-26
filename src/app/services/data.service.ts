import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {
  private apiUrl = 'http://localhost:3000/api/data'; // Backend endpoint

  constructor(private http: HttpClient) {}

  getCesData(): Observable<any> {
  return this.http.get<any>('http://localhost:3000/api/data');
}

}
