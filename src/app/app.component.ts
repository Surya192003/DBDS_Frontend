import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3" *ngIf="isAuthenticated">

      <!-- LEFT SIDE: LOGO + BRAND -->
      <a class="navbar-brand d-flex align-items-center" routerLink="/dashboard">
        <img 
          src="assets/images/dbds-logo.png" 
          alt="DBDS Logo"
          width="80"
          height="50"
        />
        <span class="fw-bold">DBDS Ireland</span>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
              data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">

        <!-- CENTER MENU -->
        <ul class="navbar-nav me-auto ms-3">
          <li class="nav-item">
            <a class="nav-link" routerLink="/dashboard">Dashboard</a>
          </li>

          <li class="nav-item" *ngIf="user?.role === 'ADMIN'">
            <a class="nav-link" routerLink="/admin">Admin Panel</a>
          </li>

          <li class="nav-item" *ngIf="user?.role === 'INSTRUCTOR'">
            <a class="nav-link" routerLink="/instructor">Instructor Panel</a>
          </li>

          <li class="nav-item" *ngIf="user?.role === 'STUDENT'">
            <a class="nav-link" routerLink="/student">Student Panel</a>
          </li>
        </ul>

        <!-- RIGHT SIDE USER INFO -->
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item me-3">
            <span class="nav-link text-white">
              Welcome, {{user?.name}}
              <span class="badge ms-2"
                    [ngClass]="{
                      'bg-danger': user?.role === 'ADMIN',
                      'bg-primary': user?.role === 'INSTRUCTOR',
                      'bg-success': user?.role === 'STUDENT'
                    }">
                {{user?.role}}
              </span>
            </span>
          </li>

          <li class="nav-item">
            <button class="btn btn-outline-light btn-sm" (click)="logout()">
              Logout
            </button>
          </li>
        </ul>

      </div>
    </nav>

    <!-- PAGE CONTENT -->
    <div class="container mt-4">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  user: any = null;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
    });
  }

  logout() {
    this.authService.logout();
  }
}