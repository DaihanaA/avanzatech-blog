import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { By } from '@angular/platform-browser';
import { RouterLinkWithHref } from '@angular/router';
import Swal from 'sweetalert2';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userSubject: BehaviorSubject<string | null>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject<string | null>(null);
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout']);
    authServiceSpy.isAuthenticated$ = isAuthenticatedSubject.asObservable();
    authServiceSpy.user$ = userSubject.asObservable();
    authServiceSpy.getCurrentUser.and.returnValue(of(null));
    authServiceSpy.logout.and.callFake(() => {}); // 🔹 Asegura que logout es un espía

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), AppComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    userSubject.next(null);
    fixture.detectChanges();
  });
  

  it('Debe crearse el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe inicializar `username` como "null" cuando no hay usuario', () => {
    expect(component.username).toBeNull();
  });

  it('Debe actualizar `username` cuando hay un usuario autenticado', () => {
    userSubject.next('UsuarioPrueba');
    fixture.detectChanges();
    expect(component.username).toBe('UsuarioPrueba');
  });

  it('Debe navegar al registro al llamar `goToRegister()`', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.goToRegister();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('Debe llamar a `authService.logout()` y redirigir a `/home` al hacer logout', fakeAsync(() => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(window, 'confirm').and.returnValue(true);

    component.logout();
    tick(100);

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('No debe cerrar sesión si el usuario cancela la confirmación', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(window, 'confirm').and.returnValue(false);

    component.logout();
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('Debe mostrar botones "Login" y "Register" si el usuario NO está autenticado', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();

    const registerButton = fixture.debugElement.query(By.css('a[routerLink="/register"]'));
    const loginButton = fixture.debugElement.query(By.css('a[routerLink="/login"]'));
    const logoutButton = fixture.debugElement.query(By.css('button'));

    expect(registerButton).toBeTruthy();
    expect(loginButton).toBeTruthy();
    expect(logoutButton).toBeFalsy();
  });

  it('Debe mostrar el nombre de usuario y el botón Logout si el usuario está autenticado', () => {
    isAuthenticatedSubject.next(true);
    userSubject.next('UsuarioPrueba');
    fixture.detectChanges();

    const usernameSpan = fixture.debugElement.query(By.css('.nav-user'));
    const logoutButton = fixture.debugElement.query(By.css('button'));

    expect(usernameSpan.nativeElement.textContent).toContain('UsuarioPrueba');
    expect(logoutButton).toBeTruthy();
  });

  it('Debe navegar a /login cuando se hace clic en el botón Login', () => {
    fixture.detectChanges();

    const loginDebugElement = fixture.debugElement.query(By.css('a[routerLink="/login"]'));
    const routerLinkInstance = loginDebugElement.injector.get(RouterLinkWithHref);

    expect(routerLinkInstance.href).toBe('/login');
  });

  it('Debe navegar a /register cuando se hace clic en el botón Register', () => {
    fixture.detectChanges();

    const registerDebugElement = fixture.debugElement.query(By.css('a[routerLink="/register"]'));
    const routerLinkInstance = registerDebugElement.injector.get(RouterLinkWithHref);

    expect(routerLinkInstance.href).toBe('/register');
  });

  it('Debe ejecutar logout() y navegar a /home cuando se hace clic en Logout', fakeAsync(() => {
    jasmine.getEnv().allowRespy(true);

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(Swal, 'fire');

    isAuthenticatedSubject.next(true);
    userSubject.next('UsuarioPrueba');
    fixture.detectChanges();

    const logoutButton = fixture.debugElement.query(By.css('button'));
    expect(logoutButton).toBeTruthy();

    logoutButton.nativeElement.click();
    fixture.detectChanges();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalled();

    tick(100);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  }));
});
