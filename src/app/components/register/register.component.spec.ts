import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavigationEnd } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['registerUser']);
    routerMock = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of(new NavigationEnd(1, '/', '/')), // ✅ Corregido
      createUrlTree: jasmine.createSpy().and.returnValue({}),
      serializeUrl: jasmine.createSpy().and.returnValue('/mock-url'),
    });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule.withRoutes([])],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => 'mockValue' } },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    authServiceMock.registerUser.and.returnValue(of({}));

    fixture.detectChanges();
  });


  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario correctamente', () => {
    expect(component.registerForm).toBeDefined();

    const { username, password, confirm_password } = component.registerForm.controls;

    expect(username).toBeDefined();
    expect(password).toBeDefined();
    expect(confirm_password).toBeDefined();

    expect(username.value).toBe('');
    expect(password.value).toBe('');
    expect(confirm_password.value).toBe('');

    expect(component.registerForm.valid).toBeFalse();
  });

  it('debería llamar a `registerUser` cuando el formulario es válido', () => {
    const formData = {
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
    };

    component.registerForm.setValue(formData);
    component.register();

    expect(authServiceMock.registerUser).toHaveBeenCalledOnceWith(formData);
  });

  it('debería manejar error de usuario ya registrado', () => {
    authServiceMock.registerUser.and.returnValue(
      throwError(() => ({
        status: 400,
        error: { username: ['A user with that username already exists.'] }
      }))
    );

    component.registerForm.setValue({
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
    });

    component.register();

    expect(component.registerForm.controls['username'].errors).toEqual({
      usernameTaken: 'Este correo ya se encuentra registrado.',
    });
  });

  it('debería navegar a login después de registro exitoso', () => {
    component.registerForm.setValue({
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
    });

    component.register();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debería mostrar error si el correo tiene un formato incorrecto', () => {
    const usernameControl = component.registerForm.controls['username'];

    usernameControl.setValue('correo_invalido');
    usernameControl.markAsTouched();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message p');
    expect(errorMessage.textContent).toContain('El formato del correo no es válido.');
  });

  it('debería mostrar error si las contraseñas no coinciden', () => {
    component.registerForm.setValue({
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'diferentePassword',
    });

    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message p');
    expect(errorMessage.textContent).toContain('Las contraseñas no coinciden.');
  });

  it('debería deshabilitar el botón de registro si el formulario es inválido', () => {
    const registerButton = fixture.nativeElement.querySelector('button[type="submit"]');

    component.registerForm.setValue({
      username: '',
      password: '',
      confirm_password: '',
    });

    fixture.detectChanges();
    expect(registerButton.disabled).toBeTrue();

    component.registerForm.setValue({
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
    });

    fixture.detectChanges();
    expect(registerButton.disabled).toBeFalse();
  });
  it('debería mostrar error si la contraseña es demasiado corta', () => {
    // 🔹 Establecer una contraseña corta (menor a 8 caracteres)
    component.registerForm.controls['password'].setValue('12345');
    component.registerForm.controls['password'].markAsTouched(); // Simula que el usuario tocó el campo

    fixture.detectChanges(); // 🔹 Forzar actualización de la vista

    // 🔹 Verificar que el error de minlength está presente
    expect(component.registerForm.controls['password'].hasError('minlength')).toBeTrue();

    // 🔹 Buscar el mensaje de error en la plantilla
    const compiled = fixture.nativeElement as HTMLElement;
    const errorMsg = compiled.querySelector('.error-message p');

    // 🔹 Verificar que el mensaje es el esperado
    expect(errorMsg?.textContent?.trim()).toBe('Debe tener al menos 8 caracteres.');
  });
  it('debería redirigir al login tras un registro exitoso', () => {
    authServiceMock.registerUser.and.returnValue(of({}));

    component.registerForm.setValue({
      username: 'test@example.com',
      password: 'password123',
      confirm_password: 'password123',
    });

    component.register();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
  it('debería marcar los campos como requeridos si están vacíos', () => {
    component.registerForm.controls['username'].setValue('');
    component.registerForm.controls['password'].setValue('');
    component.registerForm.controls['confirm_password'].setValue('');

    component.registerForm.markAllAsTouched();
    fixture.detectChanges();

    expect(component.registerForm.controls['username'].hasError('required')).toBeTrue();
    expect(component.registerForm.controls['password'].hasError('required')).toBeTrue();
    expect(component.registerForm.controls['confirm_password'].hasError('required')).toBeTrue();
  });

  it('debería aceptar correos electrónicos en mayúsculas', () => {
    const usernameControl = component.registerForm.controls['username'];

    usernameControl.setValue('TEST@EXAMPLE.COM');
    usernameControl.markAsTouched();
    fixture.detectChanges();

    expect(usernameControl.valid).toBeTrue();
  });

  









});
