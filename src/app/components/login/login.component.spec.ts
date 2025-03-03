import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';
import { FormBuilder } from '@angular/forms';
import { HomeComponent } from '../home/home.component';
import { RegisterComponent } from '../register/register.component';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'getCurrentUser']);

    authService.login.and.returnValue(of({ access: 'token123', refresh: 'token456' }));
    authService.getCurrentUser.and.returnValue(of({ username: 'testuser' }));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'home', component: HomeComponent }, // Agregar ruta de prueba
          { path: 'register', component: RegisterComponent } // También para `/register`
        ]),
        LoginComponent
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authService }
      ],
      declarations: []
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe autenticar y redirigir a /home si las credenciales son correctas', fakeAsync(() => {
    spyOn(router, 'navigate'); // 🔥 Espía router.navigate

    component.loginForm.setValue({ username: 'test@mail.com', password: 'password123' });
    component.login();
    tick(100); // ⏳ Simula el tiempo de espera del setTimeout

    expect(authService.login).toHaveBeenCalled(); // ✅ Verifica que login() fue llamado
    expect(authService.getCurrentUser).toHaveBeenCalled(); // ✅ Se llamó getCurrentUser()
    expect(router.navigate).toHaveBeenCalledWith(['/home']); // ✅ Se redirige a /home
  }));

  it('debe mostrar un mensaje de error si las credenciales son incorrectas', fakeAsync(() => {
    authService.login.and.returnValue(throwError(() => new Error('Credenciales incorrectas'))); // ❌ Sin `spyOn`
    spyOn(router, 'navigate'); // Espía el router

    component.loginForm.setValue({ username: 'test@mail.com', password: 'wrongpass' });
    component.login();
    tick(100);

    expect(authService.login).toHaveBeenCalled();
    expect(component.errorMessage).toBe('Contraseña incorrecta.');
    expect(router.navigate).not.toHaveBeenCalled(); // ❌ No debe redirigir
  }));

  it('debe redirigir a /register al presionar el botón de registro', () => {
    spyOn(router, 'navigate');

    component.goToRegister();

    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('debe redirigir a /home al presionar cancelar', () => {
    spyOn(router, 'navigate');

    component.onCancel();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
  it('debe alternar la visibilidad de la contraseña', () => {
    expect(component.passwordFieldType).toBe('password');

    component.togglePasswordVisibility();
    expect(component.passwordFieldType).toBe('text');

    component.togglePasswordVisibility();
    expect(component.passwordFieldType).toBe('password');
  });

  it('debe marcar un campo como tocado al llamarse validateField', () => {
    spyOn(component.loginForm.controls['username'], 'markAsTouched');

    component.validateField('username');

    expect(component.loginForm.controls['username'].markAsTouched).toHaveBeenCalled();
  });

  it('debe marcar el formulario como inválido si los campos están vacíos', () => {
    component.loginForm.setValue({ username: '', password: '' });

    expect(component.loginForm.invalid).toBeTrue();
  });

  it('debe deshabilitar el botón de login si el formulario es inválido', () => {
    component.loginForm.setValue({ username: '', password: '' });

    fixture.detectChanges();
    const loginButton = fixture.nativeElement.querySelector('button[type="submit"]');

    expect(loginButton.disabled).toBeTrue();
  });

  it('debe mostrar un mensaje de error si la contraseña es incorrecta', fakeAsync(() => {
    authService.login.and.returnValue(throwError(() => ({ status: 500, message: 'Server error' }))); // ⚠ Simula fallo de servidor
    spyOn(router, 'navigate');

    component.loginForm.setValue({ username: 'test@mail.com', password: 'password123' });
    component.login();
    tick(100);

    expect(authService.login).toHaveBeenCalled();
    expect(component.errorMessage).toBe('Contraseña incorrecta.'); // ✅ Mensaje correcto
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('debe almacenar el token de autenticación después de un login exitoso', fakeAsync(() => {
    component.loginForm.setValue({ username: 'test@mail.com', password: 'password123' });

    component.login();
    tick(100);

    expect(localStorage.getItem('access_token')).toBe('token123');
  }));

  // ✅ 1. Prueba si el formulario se renderiza correctamente
  it('debe renderizar el formulario de inicio de sesión', () => {
    const formElement = fixture.debugElement.query(By.css('form'));
    expect(formElement).toBeTruthy(); // Comprueba que el formulario existe
  });

  // ✅ 2. Prueba validaciones de correo y contraseña
  it('debe mostrar errores si los campos están vacíos', () => {
    component.loginForm.controls['username'].setValue('');
    component.loginForm.controls['password'].setValue('');

    // 🚨 Simulamos que el usuario interactuó con los campos
    component.loginForm.controls['username'].markAsTouched();
    component.loginForm.controls['password'].markAsTouched();

    fixture.detectChanges(); // 🚨 Forzamos la actualización de la vista

    const errorMessages = fixture.debugElement.queryAll(By.css('.error-message p'));
    expect(errorMessages.length).toBeGreaterThan(0); // Deben existir mensajes de error
  });


  it('debe mostrar un mensaje si el correo es inválido', () => {
    component.loginForm.controls['username'].setValue('correo-invalido');
    component.loginForm.controls['username'].markAsTouched();
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.error-message p'));
    expect(errorElement.nativeElement.textContent).toContain('El formato del correo no es válido.');
  });

  // ✅ 3. Prueba que el botón de mostrar contraseña funcione
  it('debe alternar la visibilidad de la contraseña', () => {
    expect(component.passwordFieldType).toBe('password');

    component.togglePasswordVisibility();
    expect(component.passwordFieldType).toBe('text');

    component.togglePasswordVisibility();
    expect(component.passwordFieldType).toBe('password');
  });

  // ✅ 4. Prueba si el login exitoso navega a "/home"
  it('debe autenticar y redirigir a /home si las credenciales son correctas', fakeAsync(() => {
    authService.login.and.returnValue(of({ access: 'token123', refresh: 'token456' }));
    authService.getCurrentUser.and.returnValue(of({ username: 'testuser' }));
    spyOn(router, 'navigate');

    component.loginForm.setValue({ username: 'test@mail.com', password: 'password123' });
    component.login();
    tick(100); // Simula la espera del setTimeout

    expect(authService.login).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  }));

  // ✅ 5. Prueba si el login con error muestra el mensaje correcto
  it('debe mostrar un mensaje de error si las credenciales son incorrectas', fakeAsync(() => {
    authService.login.and.returnValue(throwError(() => ({ status: 401, message: 'Unauthorized' })));
    spyOn(router, 'navigate');

    component.loginForm.setValue({ username: 'test@mail.com', password: 'wrongpass' });
    component.login();
    tick(100);

    fixture.detectChanges(); // 🚨 Necesario para actualizar la vista con el mensaje de error

    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement.nativeElement.textContent).toContain('Contraseña incorrecta.');
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  // ✅ 6. Prueba el botón de cancelar
  it('debe redirigir a /home al presionar cancelar', () => {
    spyOn(router, 'navigate');
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });













});
