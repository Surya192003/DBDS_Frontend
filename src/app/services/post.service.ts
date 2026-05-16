import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  // private apiUrl = 'https://dbds-backend.onrender.com/api/posts';
  private apiUrl = 'http://localhost:5010/api/posts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  create(post: Partial<Post>): Observable<any> {
    return this.http.post(this.apiUrl, post);
  }

  update(id: number, post: Partial<Post>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, post);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
