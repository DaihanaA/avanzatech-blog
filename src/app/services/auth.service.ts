import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  public isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();


  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('username');
      if (storedUser) {
        this.userSubject.next(storedUser);
      }
      this.isAuthenticatedSubject.next(this.hasToken());
    }
  }


  getUsername(): string | null {
    const currentUser = this.userSubject.value;
    console.log("Usuario autenticado en AuthService:", currentUser); // 🔍 Depuración
    return currentUser ? currentUser : null;
  }

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/register/`, userData).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la solicitud:', error); // 🔹 Ver qué envía el backend

    return throwError(() => error); // 🔹 Devuelve el error original sin modificar
  }


  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  setAuthenticated(status: boolean) {
    this.isAuthenticatedSubject.next(status);
  }

  login(credentials: { username: string; password: string }) {
    return this.http.post<{ access: string; refresh: string }>(
      `${this.apiUrl}/api/token/`,
      credentials
    ).pipe(
      tap(response => {
        if (response.access && response.refresh) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);
          }
          this.isAuthenticatedSubject.next(true);
          this.getCurrentUser().subscribe();
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error("Error en login:", error);

        // ✅ En caso de error, asegurarse de borrar cualquier token previo
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }

        return throwError(() => error); // Propaga el error real
      })
    );
  }



  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username'); // 🚀 Elimina el nombre de usuario
    }
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/home']);
  }

  getAuthToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getUserId(): number | null {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('user_id');

      return userId ? parseInt(userId, 10) : null;
    }
    return null;
  }

  getCurrentUser(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getAuthToken();
      if (!token) {
        this.userSubject.next(null);
        localStorage.removeItem('team');  // Limpia el equipo si no hay token
        return of(null);
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.get(`${this.apiUrl}/api/current-user/`, { headers }).pipe(
        tap((user: any) => {
          if (user?.username) {
            this.userSubject.next(user.username);
            localStorage.setItem('username', user.username);
            if (user.team) {
              localStorage.setItem('team', user.team);  // Guarda el equipo en localStorage
            } else {
              localStorage.removeItem('team');  // Limpia si el usuario no tiene equipo
            }
          } else {
            this.userSubject.next(null);
            localStorage.removeItem('username');
            localStorage.removeItem('team');
          }
        }),
        catchError(error => {
          console.error("Error obteniendo usuario actual:", error);
          this.userSubject.next(null);
          localStorage.removeItem('team');
          return of(null);
        })
      );
    }
    return of(null);
  }

  getUserTeam(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('team');
    }
    return null;
  }


  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!this.getAuthToken();
    }
    return false;
  }
  refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ access: string }>(
      `${this.apiUrl}/api/token/refresh/`,
      { refresh }
    ).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
      }),
      catchError(error => {
        console.error('Error refreshing token:', error);
        return throwError(() => new Error('Error refreshing token'));
      })
    );
  }

  initializeAuth() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.isAuthenticatedSubject.next(true);
        this.getCurrentUser().subscribe(); // Opcional: Volver a obtener el usuario
      }
    }
  }



}
