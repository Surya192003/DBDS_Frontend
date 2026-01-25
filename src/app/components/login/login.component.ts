import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card mt-5">
          <div class="card-body">
            <h3 class="card-title text-center mb-4">Login</h3>
            
            <div *ngIf="errorMessage" class="alert alert-danger">
              {{errorMessage}}
            </div>
            
            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" 
                       [(ngModel)]="email" name="email" required>
              </div>
              
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" 
                       [(ngModel)]="password" name="password" required>
              </div>
              
              <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                Login
              </button>
              
              <div class="text-center mt-3">
                <a routerLink="/register">Don't have an account? Register</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
  }
}