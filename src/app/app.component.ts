import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <nav class="sharp-nav" *ngIf="isAuthenticated">
      <div class="nav-wrapper">
        <div class="nav-brand" routerLink="/dashboard" (click)="isMenuOpen = false">
          <img src="assets/images/dbds-logo.png" alt="Logo" class="logo">
          <div class="brand-text">
            <span class="main-title">DBDS</span>
            <span class="sub-title">IRELAND</span>
          </div>
        </div>

        <button class="menu-toggle" (click)="isMenuOpen = !isMenuOpen">
          <i class="bi" [ngClass]="isMenuOpen ? 'bi-x-lg' : 'bi-list'"></i>
        </button>

        <div class="nav-content" [class.open]="isMenuOpen">
          <div class="nav-menu">
            <a class="menu-item" routerLink="/dashboard" routerLinkActive="active" (click)="isMenuOpen = false">DASHBOARD</a>
            <a class="menu-item" *ngIf="user?.role === 'ADMIN'" routerLink="/admin" routerLinkActive="active" (click)="isMenuOpen = false">ADMIN</a>
            <a class="menu-item" *ngIf="user?.role === 'INSTRUCTOR'" routerLink="/instructor" routerLinkActive="active" (click)="isMenuOpen = false">INSTRUCTOR</a>
            <a class="menu-item" *ngIf="user?.role === 'STUDENT'" routerLink="/student" routerLinkActive="active" (click)="isMenuOpen = false">LEARNING</a>
          </div>

          <div class="nav-user">
            <div class="user-pill">
              <div class="u-avatar">
                <img *ngIf="user?.photo_url" [src]="user.photo_url">
                <i *ngIf="!user?.photo_url" class="bi bi-person-fill"></i>
              </div>
              <div class="user-meta">
                <span class="u-name">{{user?.name | uppercase}}</span>
                <span class="u-role">{{user?.role}}</span>
              </div>
              <button class="logout-sq" (click)="logout()" title="Logout">
                <i class="bi bi-power"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="viewport">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host { --black: #000000; --white: #ffffff; }

    .sharp-nav {
      background: var(--white);
      border-bottom: 3px solid var(--black);
      height: 70px;
      position: sticky;
      top: 0;
      z-index: 1030;
      display: flex;
      align-items: center;
    }

    .nav-wrapper {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .nav-brand { display: flex; align-items: center; cursor: pointer; gap: 12px; }
    .logo { height: 35px; width: auto; }
    .brand-text { display: flex; flex-direction: column; line-height: 1; }
    .main-title { font-weight: 900; font-size: 1.2rem; letter-spacing: -1px; color: var(--black); }
    .sub-title { font-size: 0.6rem; font-weight: 400; letter-spacing: 2px; color: var(--black); }

    /* DESKTOP MENU STYLES */
    .nav-content { display: flex; align-items: center; flex: 1; justify-content: space-between; margin-left: 40px; }
    .nav-menu { display: flex; gap: 4px; }
    
    .menu-item {
      padding: 8px 16px;
      text-decoration: none;
      color: var(--black);
      font-size: 0.8rem;
      font-weight: 800;
      border: 2px solid transparent;
      transition: 0.1s;
    }
    .menu-item:hover, .menu-item.active { background: var(--black); color: var(--white); }
    .menu-item.active { border: 2px solid var(--black); }

    .user-pill {
      display: flex;
      align-items: center;
      border: 2px solid var(--black);
      padding: 4px;
      gap: 12px;
      background: var(--white);
    }
    .user-meta { display: flex; flex-direction: column; padding-right: 10px; }
    .u-name { font-size: 0.75rem; font-weight: 900; color: var(--black); }
    .u-role { font-size: 0.6rem; font-weight: 400; color: var(--black); text-transform: uppercase; }
    .u-avatar { width: 32px; height: 32px; background: var(--black); color: var(--white); overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .u-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .logout-sq {
      border: none;
      background: var(--black);
      color: var(--white);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .menu-toggle { display: none; background: var(--black); color: var(--white); border: none; padding: 5px 10px; font-size: 1.5rem; }

    .viewport { padding: 20px; background: #fff; min-height: calc(100vh - 70px); }

    /* MOBILE BREAKPOINT */
    @media (max-width: 991px) {
      .menu-toggle { display: block; }
      
      .nav-content {
        display: none;
        position: absolute;
        top: 67px;
        left: 0;
        width: 100%;
        background: var(--white);
        flex-direction: column;
        margin-left: 0;
        padding: 20px;
        border-bottom: 3px solid var(--black);
        gap: 20px;
      }

      .nav-content.open { display: flex; }
      .nav-menu { flex-direction: column; width: 100%; }
      .menu-item { width: 100%; padding: 15px; border-bottom: 1px solid #000; }
      .user-pill { width: 100%; justify-content: space-between; }
    }
  `]
})
export class AppComponent implements OnInit {
  user: any = null;
  isAuthenticated = false;
  isMenuOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
    });
  }

  logout() {
    this.isMenuOpen = false;
    this.authService.logout();
  }
}