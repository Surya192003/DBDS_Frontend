import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgor-password',
  templateUrl: './forgor-password.component.html',
  styleUrls: ['./forgor-password.component.css']
})
export class ForgorPasswordComponent {
  email = '';
  message = '';
  error = '';
  loading = false;
  isDev = false;   // set to true if you want to show the reset link in dev

  constructor(private authService: AuthService, private router: Router) {}

  submit() {
    if (!this.email) return;
    this.loading = true;
    this.error = '';
    this.message = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res.success) {
          this.error = res.message || 'Something went wrong';
          return;
        }
        // In development, the backend may return a reset link
        if (res.development?.reset_link || res.development?.reset_token) {
          this.message = `Development mode: Reset link: ${res.development.reset_link}`;
          // Or automatically navigate:
          // this.router.navigate(['/reset-password'], { queryParams: { token: res.development.reset_token } });
        } else {
          this.message = res.message;   // "If your email is registered..."
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Request failed';
      }
    });
  }

}
