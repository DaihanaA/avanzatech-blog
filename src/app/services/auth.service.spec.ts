import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';


describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        importProvidersFrom(HttpClientTestingModule), // ✅ Alternativa cuando 'withHttpTesting()' no está disponible
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // ✅ Verifica que no haya peticiones pendientes
    localStorage.clear();
    });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

 // 🔹 Test para login
 it('should login and store tokens', () => {
  const mockResponse = {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token'
  };
  const mockUser = { username: 'testUser', team: 'testTeam' };


  service.login({ username: 'testuser', password: 'password123' }).subscribe();


    // ✅ Simula la respuesta del login
    const reqLogin = httpMock.expectOne('http://localhost:8000/api/token/');
    expect(reqLogin.request.method).toBe('POST');
    reqLogin.flush(mockResponse); // Devuelve tokens simulados

    // ✅ Simula la segunda solicitud para obtener el usuario
    const reqUser = httpMock.expectOne('http://localhost:8000/api/current-user/');
    expect(reqUser.request.method).toBe('GET');
    reqUser.flush(mockUser); // Devuelve datos de usuario simulados

    // ✅ Verifica que los valores fueron almacenados
    expect(localStorage.getItem('access_token')).toBe(mockResponse.access);
    expect(localStorage.getItem('refresh_token')).toBe(mockResponse.refresh);
    expect(localStorage.getItem('username')).toBe(mockUser.username);
    expect(localStorage.getItem('team')).toBe(mockUser.team);
    service.isAuthenticated$.subscribe(value => {
      expect(value).toBeTruthy(); // O false según la prueba
    });
  });

// 🔹 Test para logout
it('should clear storage and redirect on logout', () => {
  localStorage.setItem('access_token', 'mock-token');
  localStorage.setItem('username', 'testuser');

  service.logout(); // ✅ Ejecuta realmente el método

  expect(localStorage.getItem('access_token')).toBeNull();
  expect(localStorage.getItem('username')).toBeNull();
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
});


// 🔹 Test para obtener usuario autenticado
it('should get the current user', () => {
  const mockUser = { username: 'testuser', team: 'teamA' };
  localStorage.setItem('access_token', 'mock-token');

  service.getCurrentUser().subscribe(user => {
    expect(user).toEqual(mockUser);
    expect(localStorage.getItem('username')).toBe('testuser');
    expect(localStorage.getItem('team')).toBe('teamA');
  });

  const req = httpMock.expectOne(`${environment.apiUrl}/api/current-user/`);
  expect(req.request.method).toBe('GET');
  req.flush(mockUser);
});

// 🔹 Test para verificar si el usuario está autenticado
it('should return true if token exists', () => {
  localStorage.setItem('access_token', 'mock-token');
  expect(service.isLoggedIn()).toBeTrue();
});

it('should return false if no token exists', () => {
  localStorage.removeItem('access_token');
  expect(service.isLoggedIn()).toBeFalse();
});

it('should not store tokens on login failure', () => {
  localStorage.setItem('access_token', 'mock-token'); // ✅ Simula estado previo con token
  localStorage.setItem('refresh_token', 'mock-refresh-token');

  service.login({ username: 'testuser', password: 'wrongpass' }).subscribe({
    next: () => fail('Expected error, but got success'),
    error: (error) => {
      expect(error.status).toBe(401); // ✅ Verifica que el error sea 401
      expect(localStorage.getItem('access_token')).toBeNull(); // ✅ Tokens deben ser eliminados
      expect(localStorage.getItem('refresh_token')).toBeNull();
    }
  });

  const req = httpMock.expectOne('http://localhost:8000/api/token/');
  expect(req.request.method).toBe('POST');

  // ✅ Simula fallo en login con código de estado 401
  req.flush(
    { detail: 'Invalid credentials' },
    { status: 401, statusText: 'Unauthorized' }
  );
});

it('should clear storage, update auth state, and redirect on logout', () => {
  localStorage.setItem('access_token', 'mock-token');
  localStorage.setItem('username', 'testuser');

  service.logout();

  expect(localStorage.getItem('access_token')).toBeNull();
  expect(localStorage.getItem('username')).toBeNull();
  service.isAuthenticated$.subscribe(value => {
    expect(value).toBeFalse(); // O false según la prueba
  });
   // ✅ Verificar estado de autenticación
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
});


it('should refresh token if access token is expired', () => {
  localStorage.setItem('refresh_token', 'mock-refresh-token');

  service.refreshToken().subscribe(token => {
    expect(token).toEqual({ access: 'new-access-token' }); // ✅ Verifica el token devuelto
    expect(localStorage.getItem('access_token')).toBe('new-access-token'); // ✅ Verifica el almacenamiento
  });

  // ✅ Simula la petición de refresh token
  const req = httpMock.expectOne(`${environment.apiUrl}/api/token/refresh/`);
  expect(req.request.method).toBe('POST');

  // ✅ Devuelve un nuevo token
  req.flush({ access: 'new-access-token' });
});

it('should return the stored team from localStorage', () => {
  localStorage.setItem('team', 'teamA');
  expect(service.getUserTeam()).toBe('teamA');
});

it('should return null if no team is stored', () => {
  localStorage.removeItem('team');
  expect(service.getUserTeam()).toBeNull();
});

it('should refresh the token and store the new access token', () => {
  localStorage.setItem('refresh_token', 'mock-refresh-token');

  const mockResponse = { access: 'new-access-token' };

  service.refreshToken().subscribe();

  const req = httpMock.expectOne(`${environment.apiUrl}/api/token/refresh/`);
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual({ refresh: 'mock-refresh-token' });

  req.flush(mockResponse);

  expect(localStorage.getItem('access_token')).toBe('new-access-token');
});

it('should return an error if refresh token is not available', () => {
  localStorage.removeItem('refresh_token');

  service.refreshToken().subscribe({
    next: () => fail('Expected an error'),
    error: (error) => {
      expect(error.message).toBe('No refresh token available');
    }
  });
});
it('should update authentication state', async () => {
  service.setAuthenticated(true);
  expect(await firstValueFrom(service.isAuthenticated$)).toBeTrue();

  service.setAuthenticated(false);
  expect(await firstValueFrom(service.isAuthenticated$)).toBeFalse();
});
it('should initialize authentication state from localStorage', () => {
  localStorage.setItem('access_token', 'mock-token');

  service.initializeAuth();

  service.isAuthenticated$.subscribe(value => {
    expect(value).toBeTrue();
  });

  const req = httpMock.expectOne(`${environment.apiUrl}/api/current-user/`);
  expect(req.request.method).toBe('GET');
  req.flush({ username: 'testuser' });

  expect(localStorage.getItem('username')).toBe('testuser');
});



});
