// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css']
// })
// export class AppComponent {
//   title = "Management"
// }

import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark" *ngIf="isAuthenticated">
      <div class="container">
        <a class="navbar-brand" routerLink="/dashboard">Dance Management</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                data-bs-target="#navbarNav" aria-controls="navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
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
          <ul class="navbar-nav">
            <li class="nav-item">
              <span class="nav-link">
                Welcome, {{user?.name}} 
                <span class="badge" 
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
              <button class="btn btn-outline-light btn-sm" (click)="logout()">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="container mt-4">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  title = "Management"
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
