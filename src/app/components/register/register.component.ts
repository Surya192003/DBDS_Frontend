import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role = '';
  acceptedTerms = false;
  selectedFile: File | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.acceptedTerms) {
      this.errorMessage = 'MANDATORY_ACTION: ACCEPT_TERMS_TO_PROCEED';
      return;
    }

    if (!this.name || !this.email || !this.password || !this.role) {
      this.errorMessage = 'ERROR: ALL_FIELDS_REQUIRED';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      terms_accepted: true
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'REGISTRATION_SUCCESSFUL // AWAITING_ADMIN_APPROVAL';
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'SYSTEM_FAILURE: REGISTRATION_REJECTED';
      }
    });
  }

  resetForm() {
    this.name = ''; this.email = ''; this.password = ''; this.role = ''; this.acceptedTerms = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
    }
  }
}