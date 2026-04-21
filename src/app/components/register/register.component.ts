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

              <!-- Add this section to registration form -->
<div class="mb-3">
  <label class="form-label">Profile Photo (Optional)</label>
  <input type="file" class="form-control" (change)="onFileSelected($event)" accept="image/*">
  <div class="form-text">
    You can upload a profile photo later from your profile settings
  </div>
  <div *ngIf="selectedFile" class="mt-2">
    <small>Selected: {{selectedFile.name}}</small>
  </div>
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
  selectedFile: File | null = null;
  name: string = '';
  email: string = '';
  password: string = '';
  role: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

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
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      return;
    }

    const file = input.files[0];

    // Optional: validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    // Optional: validate file size (2MB example)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size should be less than 2MB');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }
}