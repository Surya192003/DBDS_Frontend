import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  roleId?: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    // private apiUrl = 'https://dbds-backend.onrender.com/api';
  private apiUrl = 'http://localhost:5010/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  // ✅ Clear storage method
  private clearStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  private loadStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      this.clearStorage();
      this.currentUserSubject.next(null);
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  // ✅ Error handler with throwError
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.status === 0) {
      // Client-side or network error
      errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      errorMessage = error.error?.message || 'Invalid credentials';
      this.clearStorage();
      this.currentUserSubject.next(null);
    } else if (error.status === 403) {
      errorMessage = error.error?.message || 'Access denied';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('API Error:', {
      message: errorMessage,
      status: error.status,
      error: error.error
    });
    
    // ✅ Using throwError with a factory function
    return throwError(() => new Error(errorMessage));
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response: any) => {
          if (response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ✅ Force logout on authentication error
  forceLogout(message?: string): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], {
      queryParams: { message: message || 'Session expired. Please login again.' }
    });
  }

  // ✅ Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.currentUser;
    return user ? user.role === role : false;
  }

  // ✅ Check if user has any of the given roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser;
    return user ? roles.includes(user.role) : false;
  }

  // ✅ Validate token (optional - could be used to check if token is still valid)
  validateToken(): Observable<boolean> {
    return new Observable(observer => {
      const token = this.token;
      if (!token) {
        observer.next(false);
        observer.complete();
        return;
      }

      // You could make an API call to validate token
      // For now, just check if we have a token and user
      const user = localStorage.getItem('user');
      observer.next(!!(token && user));
      observer.complete();
    });
  }

  // ✅ Get auth headers for HTTP requests
  getAuthHeaders(): { [header: string]: string } {
    const token = this.token;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ✅ Refresh user data from API
  refreshUserData(): Observable<any> {
  return this.http.get(`${this.apiUrl}/auth/profile`, {
    headers: this.getAuthHeaders()
  }).pipe(
    tap((res: any) => {
      const user = res.profile;   // 👈 note: res.profile, not res directly
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }),
    catchError(this.handleError.bind(this))
  );
}

  // ✅ Check if user is admin
  get isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // ✅ Check if user is instructor
  get isInstructor(): boolean {
    return this.hasRole('INSTRUCTOR');
  }

  // ✅ Check if user is student
  get isStudent(): boolean {
    return this.hasRole('STUDENT');
  }

  forgotPassword(email: string) {
  return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
}

resetPassword(token: string, new_password: string, confirm_password: string) {
  return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, new_password, confirm_password });
}
}
