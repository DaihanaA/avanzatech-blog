import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { getCookie } from 'typescript-cookie';

// Token de contexto para permitir solicitudes sin credenciales
const ADD_CREDENTIALS = new HttpContextToken<boolean>(() => true);

/**
 * Función para deshabilitar credenciales en una solicitud específica.
 */
export function withoutCredentials() {
  return new HttpContext().set(ADD_CREDENTIALS, false);
}

/**
 * Interceptor para agregar el token de autenticación y credenciales.
 */
export const credentialInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof document !== 'undefined') {
    const token = localStorage.getItem('access_token');

    if (token) {
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(clonedReq);
    }
  }

  return next(req); // Si no hay token, sigue sin modificar la solicitud
};

