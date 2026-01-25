import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card mt-5">
          <div class="card-body">
            <h3 class="card-title text-center mb-4">Register</h3>
            
            <div *ngIf="errorMessage" class="alert alert-danger">
              {{errorMessage}}
            </div>
            
            <div *ngIf="successMessage" class="alert alert-success">
              {{successMessage}}
            </div>
            
            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="name" class="form-label">Full Name</label>
                <input type="text" class="form-control" id="name" 
                       [(ngModel)]="name" name="name" required>
              </div>
              
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
              
              <div class="mb-3">
                <label for="role" class="form-label">Role</label>
                <select class="form-select" id="role" [(ngModel)]="role" name="role" required>
                  <option value="">Select Role</option>
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                </select>
              </div>
              
              <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                Register
              </button>
              
              <div class="text-center mt-3">
                <a routerLink="/login">Already have an account? Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  role: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.name || !this.email || !this.password || !this.role) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Registration successful! Please wait for admin approval.';
        this.name = '';
        this.email = '';
        this.password = '';
        this.role = '';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}