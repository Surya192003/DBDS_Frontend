import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Announcement } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private apiUrl = 'https://dbds-backend.onrender.com/api/announcements';
  // private apiUrl = 'http://localhost:5010/api/announcements';

  constructor(private http: HttpClient) { }

  getAll(category?: string): Observable<Announcement[]> {
    let url = this.apiUrl;
    if (category) url += `?category=${category}`;
    return this.http.get<Announcement[]>(url);
  }

  getOne(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  update(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  register(id: number, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/register`, {});
  }

  getRegistrations(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/registrations`);
  }
  getMyRegistrations(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/my-registrations`);
  }
  markRegistrationPaid(registrationId: number) {
    return this.http.put(`${this.apiUrl}/registrations/${registrationId}/complete`, {});
  }


}
