import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
// import { AuthService } from './services/auth.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
  // Wait until the auth service has finished loading from storage
  return this.authService.isInitialized$.pipe(
    filter((initialized: boolean) => initialized === true),  // wait for init
    switchMap(() => this.authService.currentUser$),
    take(1),
    map(user => {
      if (!user) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
      const requiredRole = route.data['role'];
      if (requiredRole && user.role !== requiredRole) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    })
  );
}
}