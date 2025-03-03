import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.router.navigate(['/home']);
        }
        return isAuthenticated;
      }),
      catchError((error) => {
        console.error('Error en AuthService:', error);
        this.router.navigate(['/home']); // Redirigir en caso de error
        return of(false); // Devolver `false` en caso de error
      })
    );
  }
}

