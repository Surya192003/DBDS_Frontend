import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3 class="card-title">Welcome, {{user?.name}}!</h3>
            <p class="card-text">Role: {{user?.role}}</p>
            
            <div class="mt-4">
              <h5>Quick Actions:</h5>
              <div class="row">
                <div class="col-md-4 mb-3" *ngIf="user?.role === 'ADMIN'">
                  <a routerLink="/admin" class="btn btn-primary w-100">Admin Dashboard</a>
                </div>
                <div class="col-md-4 mb-3" *ngIf="user?.role === 'INSTRUCTOR'">
                  <a routerLink="/instructor" class="btn btn-primary w-100">Instructor Dashboard</a>
                </div>
                <div class="col-md-4 mb-3" *ngIf="user?.role === 'STUDENT'">
                  <a routerLink="/student" class="btn btn-primary w-100">Student Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  user: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }
}