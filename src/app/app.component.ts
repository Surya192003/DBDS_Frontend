import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from './services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],       // we’ll create a CSS file
  animations: [
    // optional: smooth open/close for mobile
    trigger('mobileMenu', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.2s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.15s ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
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

  getFullImageUrl(photoUrl: string): string {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `https://your-api-domain.com/storage/${photoUrl}`;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(currentScroll - this.lastScrollTop) <= this.scrollThreshold) return;
    this.isNavVisible = !(currentScroll > this.lastScrollTop && currentScroll > 70);
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  logout() {
    this.isMenuOpen = false;
    this.isNavVisible = true;
    this.authService.logout();
  }
}