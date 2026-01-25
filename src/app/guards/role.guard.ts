import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.currentUser;
    const expectedRole = route.data['role'];
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (expectedRole && user.role !== expectedRole) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    return true;
  }
}