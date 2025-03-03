import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { throwError } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated$']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', (done) => {
    authServiceSpy.isAuthenticated$ = of(true); // Simula que el usuario está autenticado

    guard.canActivate({} as any, {} as any).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should redirect to home when user is not authenticated', (done) => {
    authServiceSpy.isAuthenticated$ = of(false); // Simula que el usuario NO está autenticado

    guard.canActivate({} as any, {} as any).subscribe((result) => {
      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
      done();
    });
  });

  it('should return an Observable<boolean> from canActivate', () => {
    authServiceSpy.isAuthenticated$ = of(true);
    expect(guard.canActivate({} as any, {} as any)).toBeInstanceOf(Object); // Observable
  });
  it('should handle errors from AuthService gracefully', (done) => {
    authServiceSpy.isAuthenticated$ = throwError(() => new Error('AuthService error'));

    guard.canActivate({} as any, {} as any).subscribe({
      next: (result) => {
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        done(); // Finaliza la prueba correctamente
      },
      error: (err) => {
        console.error('Error in test:', err);
        fail('Error should be handled gracefully'); // Falla la prueba si el error no se maneja correctamente
        done();
      }
    });
  });





});
