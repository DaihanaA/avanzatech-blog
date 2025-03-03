import { RenderMode, ServerRoute } from '@angular/ssr';



export const serverRoutes: ServerRoute[] = [
  {
    path: 'posts/:id',
    renderMode: RenderMode.Server // Cambia a Server para manejarlo dinámicamente
  },
  {
    path: 'edit-post/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
