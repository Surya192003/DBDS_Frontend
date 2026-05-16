import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/* ------------------------------------------------------------------ */
/*  User model (can also be imported from a shared file)               */
/* ------------------------------------------------------------------ */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  roleId?: number;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/*  AuthService                                                        */
/* ------------------------------------------------------------------ */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /* ================================================================ */
  /*  Configuration                                                    */
  /* ================================================================ */

  // Use environment.ts in a real project – hardcoded here for brevity
  // private apiUrl = 'https://dbds-backend.onrender.com/api';
  private apiUrl = 'http://localhost:5010/api'; 

  /* ================================================================ */
  /*  State                                                            */
  /* ================================================================ */

  private initialized = false;
  public initPromise!: Promise<void>;          // used by APP_INITIALIZER
  isInitialized$ = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  /* ================================================================ */
  /*  Constructor & Initialization                                     */
  /* ================================================================ */

  constructor(private http: HttpClient, private router: Router) {
    this.initPromise = this.initializeAuth();
  }

  /**
   * Loads stored user/token from localStorage.
   * Called automatically during service construction (via initPromise).
   */
  private async initializeAuth(): Promise<void> {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        // Optional: validate token freshness against backend
        // await firstValueFrom(this.validateToken());
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      this.clearStorage();
      this.currentUserSubject.next(null);
    } finally {
      this.initialized = true;
      this.isInitialized$.next(true);
    }
  }

  /** Exposes the init promise for Angular’s APP_INITIALIZER. */
  static initializeApp(authService: AuthService) {
    return () => authService.initPromise;
  }

  /* ================================================================ */
  /*  Local Storage Helpers                                            */
  /* ================================================================ */

  private clearStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  /* ================================================================ */
  /*  Public Getters (synchronous)                                     */
  /* ================================================================ */

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') && localStorage.getItem('user'));
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  // Role checks
  get isAdmin(): boolean { return this.hasRole('ADMIN'); }
  get isInstructor(): boolean { return this.hasRole('INSTRUCTOR'); }
  get isStudent(): boolean { return this.hasRole('STUDENT'); }

  /* ================================================================ */
  /*  Error Handling                                                   */
  /* ================================================================ */

  private handleError(error: any): Observable<never> {
    let message = 'An unexpected error occurred';

    if (error.status === 0) {
      message = 'Network error: Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      message = error.error?.message || 'Invalid credentials';
      this.clearStorage();
      this.currentUserSubject.next(null);
    } else if (error.status === 403) {
      message = error.error?.message || 'Access denied';
    } else if (error.status === 404) {
      message = 'API endpoint not found';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    console.error('API Error:', { message, status: error.status, error: error.error });
    return throwError(() => new Error(message));
  }

  /* ================================================================ */
  /*  Authentication API Calls                                         */
  /* ================================================================ */

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
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

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  forceLogout(message?: string): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], {
      queryParams: message ? { message } : {}
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, new_password: string, confirm_password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      token,
      new_password,
      confirm_password
    });
  }

  /* ================================================================ */
  /*  Profile & Token                                                  */
  /* ================================================================ */

  /**
   * Call this after updating profile (photo, phone, etc.).
   * Expects the backend to return { profile: User }.
   */
  refreshUserData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((res: any) => {
        const user = res.profile;   // backend returns { profile: ... }
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /** Simple object-fit token validation (can be replaced with backend call). */
  validateToken(): Observable<boolean> {
    return new Observable(observer => {
      const token = this.token;
      const user = localStorage.getItem('user');
      observer.next(!!(token && user));
      observer.complete();
    });
  }

  /** Returns headers for authenticated requests (Content-Type + Bearer). */
  getAuthHeaders(): { [header: string]: string } {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /* ================================================================ */
  /*  Role Helpers                                                     */
  /* ================================================================ */

  hasRole(role: string): boolean {
    const user = this.currentUser;
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser;
    return user ? roles.includes(user.role) : false;
  }
}