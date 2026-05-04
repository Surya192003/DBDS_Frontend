import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <nav class="glass-nav" [class.nav-hidden]="!isNavVisible">
      <div class="nav-wrapper">
        <!-- Brand -->
        <div class="nav-brand" routerLink="/dashboard" (click)="isMenuOpen = false">
          <img src="assets/images/dbds-logo.png" alt="DBDS Logo" class="logo" />
          <div class="brand-text">
            <span class="main-title">DBDS</span>
            <span class="sub-title">IRELAND</span>
          </div>
        </div>

        <!-- Mobile toggle -->
        <button class="menu-toggle" (click)="isMenuOpen = !isMenuOpen" aria-label="Menu">
          <i class="bi" [ngClass]="isMenuOpen ? 'bi-x-lg' : 'bi-list'"></i>
        </button>

        <!-- Navigation content -->
        <div class="nav-content" [class.open]="isMenuOpen">
          <div class="nav-menu">
            <a class="menu-item" routerLink="/dashboard" routerLinkActive="active" (click)="isMenuOpen = false">DASHBOARD</a>

            <ng-container *ngIf="!isAuthenticated">
              <a class="menu-item" routerLink="/login" routerLinkActive="active" (click)="isMenuOpen = false">LOGIN</a>
              <a class="menu-item" routerLink="/register" routerLinkActive="active" (click)="isMenuOpen = false">REGISTER</a>
            </ng-container>

            <ng-container *ngIf="isAuthenticated">
              <a class="menu-item" *ngIf="user?.role === 'ADMIN'" routerLink="/admin" routerLinkActive="active" (click)="isMenuOpen = false">ADMIN</a>
              <a class="menu-item" *ngIf="user?.role === 'INSTRUCTOR'" routerLink="/instructor" routerLinkActive="active" (click)="isMenuOpen = false">INSTRUCTOR</a>
              <a class="menu-item" *ngIf="user?.role === 'STUDENT'" routerLink="/student" routerLinkActive="active" (click)="isMenuOpen = false">LEARNING</a>
            </ng-container>
          </div>

          <div class="nav-user" *ngIf="isAuthenticated">
            <div class="user-pill glass-card">
              <div class="u-avatar">
                <img *ngIf="user?.photo_url" [src]="getFullImageUrl(user.photo_url)" alt="Avatar" />
                <i *ngIf="!user?.photo_url" class="bi bi-person-fill"></i>
              </div>
              <div class="user-meta">
                <span class="u-name">{{ user?.name | uppercase }}</span>
                <span class="u-role">{{ user?.role }}</span>
              </div>
              <button class="logout-btn" (click)="logout()" title="Logout">
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
    /* ----- GLOBAL RESET (to match dashboard) ----- */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* ----- GLASS NAVIGATION (dashboard theme) ----- */
    .glass-nav {
      position: sticky;
      top: 0;
      z-index: 1030;
      background: rgba(5, 12, 20, 0.72);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(79, 195, 247, 0.28);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      height: 70px;
      display: flex;
      align-items: center;
      transition: transform 0.25s ease-out;
      transform: translateY(0);
      font-family: 'Courier New', Courier, monospace;
    }

    .glass-nav.nav-hidden {
      transform: translateY(-100%);
    }

    .nav-wrapper {
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.8rem;
    }

    /* Brand */
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .nav-brand:hover {
      transform: translateY(-1px);
    }
    .logo {
      height: 42px;
      width: auto;
      filter: drop-shadow(0 0 6px rgba(79, 195, 247, 0.4));
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .main-title {
      font-weight: 950;
      font-size: 1.35rem;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff, #4fc3f7);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      text-shadow: 0 0 12px rgba(79, 195, 247, 0.3);
    }
    .sub-title {
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #9fe4ff;
    }

    /* Navigation content */
    .nav-content {
      display: flex;
      align-items: center;
      flex: 1;
      justify-content: space-between;
      margin-left: 2rem;
    }

    .nav-menu {
      display: flex;
      gap: 0.5rem;
    }

    .menu-item {
      padding: 0.55rem 1.2rem;
      text-decoration: none;
      color: rgba(234, 248, 255, 0.82);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      border-radius: 999px;
      transition: all 0.22s ease;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(79, 195, 247, 0.16);
      backdrop-filter: blur(8px);
    }

    .menu-item:hover {
      color: #001018;
      background: linear-gradient(135deg, #86dcff, #4fc3f7);
      border-color: rgba(79, 195, 247, 0.7);
      box-shadow: 0 6px 14px rgba(79, 195, 247, 0.24);
      transform: translateY(-2px);
    }

    .menu-item.active {
      color: #001018;
      background: linear-gradient(135deg, #b8efff, #4fc3f7);
      border-color: rgba(79, 195, 247, 0.9);
      box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
    }

    /* User pill (glass-card style) */
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      border-radius: 999px;
      padding: 0.3rem 0.6rem 0.3rem 0.3rem;
      background: rgba(5, 12, 20, 0.58);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(79, 195, 247, 0.28);
      transition: all 0.2s ease;
    }
    .user-pill:hover {
      border-color: rgba(79, 195, 247, 0.6);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), 0 0 12px rgba(79, 195, 247, 0.2);
    }

    .u-avatar {
      width: 38px;
      height: 38px;
      background: linear-gradient(145deg, #4fc3f7, #0284c7);
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      color: white;
      font-size: 1.2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .u-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .u-name {
      font-size: 0.78rem;
      font-weight: 800;
      color: #eaf8ff;
      letter-spacing: 0.02em;
    }
    .u-role {
      font-size: 0.6rem;
      font-weight: 700;
      color: #9fe4ff;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 108, 108, 0.42);
      border-radius: 999px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ffd0d0;
      transition: all 0.2s ease;
      font-size: 1rem;
    }
    .logout-btn:hover {
      background: linear-gradient(135deg, #ffd1d1, #ff6b6b);
      color: #1a0000;
      border-color: #ff6b6b;
      transform: scale(1.05);
      box-shadow: 0 0 12px rgba(255, 87, 87, 0.4);
    }

    /* Mobile toggle */
    .menu-toggle {
      display: none;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(79, 195, 247, 0.28);
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      font-size: 1.3rem;
      color: #9fe4ff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .menu-toggle:hover {
      background: rgba(79, 195, 247, 0.2);
      border-color: #4fc3f7;
    }

    /* Viewport (dashboard background) */
    .viewport {
      min-height: calc(100vh - 70px);
      background: radial-gradient(circle at 15% 8%, rgba(79, 195, 247, 0.2), transparent 28rem),
                  radial-gradient(circle at 84% 18%, rgba(0, 188, 212, 0.12), transparent 25rem),
                  linear-gradient(135deg, #020409 0%, #050b12 42%, #000000 100%);
    }

    /* Responsive */
    @media (max-width: 991px) {
      .menu-toggle {
        display: block;
      }
      .nav-content {
        display: none;
        position: absolute;
        top: 70px;
        left: 0;
        width: 100%;
        background: rgba(3, 9, 15, 0.94);
        backdrop-filter: blur(24px);
        border-bottom: 1px solid rgba(79, 195, 247, 0.28);
        flex-direction: column;
        margin-left: 0;
        padding: 1.5rem;
        gap: 1.5rem;
        z-index: 1020;
        box-shadow: 0 24px 40px rgba(0, 0, 0, 0.5);
      }
      .nav-content.open {
        display: flex;
      }
      .nav-menu {
        flex-direction: column;
        width: 100%;
        gap: 0.75rem;
      }
      .menu-item {
        width: 100%;
        text-align: center;
        padding: 0.75rem;
      }
      .user-pill {
        width: 100%;
        justify-content: space-between;
      }
    }

    @media (max-width: 560px) {
      .nav-wrapper {
        padding: 0 1rem;
      }
      .main-title {
        font-size: 1rem;
      }
      .sub-title {
        font-size: 0.5rem;
        letter-spacing: 1.5px;
      }
      .logo {
        height: 32px;
      }
      .brand-text {
        display: none;
      }
      .menu-item {
        font-size: 0.7rem;
        padding: 0.6rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  user: any = null;
  isAuthenticated = false;
  isMenuOpen = false;
  isNavVisible = true;
  private lastScrollTop = 0;
  private scrollThreshold = 10;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
    });
  }

  // Helper to build full image URL (same as dashboard)
  getFullImageUrl(photoUrl: string): string {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    // Adjust base URL according to your API
    return `https://your-api-domain.com/storage/${photoUrl}`;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(currentScroll - this.lastScrollTop) <= this.scrollThreshold) return;
    if (currentScroll > this.lastScrollTop && currentScroll > 70) {
      this.isNavVisible = false;
    } else {
      this.isNavVisible = true;
    }
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  logout() {
    this.isMenuOpen = false;
    this.isNavVisible = true;
    this.authService.logout();
  }
}