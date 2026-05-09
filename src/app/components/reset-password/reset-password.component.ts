import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';
  loading = false;

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  submit() {
    if (!this.token || !this.newPassword || !this.confirmPassword) {
      this.error = 'All fields are required';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.resetPassword(this.token, this.newPassword, this.confirmPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.message = res.message;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.error = res.message || 'Reset failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Reset failed';
      }
    });
  }
}