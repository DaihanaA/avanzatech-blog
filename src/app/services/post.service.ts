import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { shareReplay } from 'rxjs/operators';
import { Post, PaginatedResponse } from '../models/post.model';
import { Like } from '../models/like.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = environment.apiUrl;
  private token: string = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('access_token') || '';
    }
  }

  // 📌 Obtener el token solo en el navegador
  getToken(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token') || '';
    }
    return '';
  }

  // 📌 Headers con autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  // 📌 Obtener posts paginados
  getPosts(page: number, pageSize: number): Observable<PaginatedResponse> {
    const offset = (page - 1) * pageSize;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', offset.toString());

    return this.http.get<PaginatedResponse>(`${this.apiUrl}/api/posts/`, { params, headers: this.getAuthHeaders() });
  }

  // 📌 Obtener un post por ID
  getPostById(postId: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/api/posts/${postId}/`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1));
  }

  // 📌 Obtener likes paginados
  getLikes(postId: number, limit: number, offset: number): Observable<{
    results: Like[],
    total_pages: number,
    current_page: number,
    next: string | null,
    previous: string | null
  }> {
    return this.http.get<{
      results: Like[],
      total_pages: number,
      current_page: number,
      next: string | null,
      previous: string | null
    }>(
      `${this.apiUrl}/api/likes/?post=${postId}&limit=${limit}&offset=${offset}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 📌 Agregar un like
  addLike(postId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/likes/${postId}/`, {}, { headers: this.getAuthHeaders() });
  }

  // 📌 Remover un like
  removeLike(postId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/likes/${postId}/`, { headers: this.getAuthHeaders() });
  }

  // 📌 Contar comentarios
  getCommentCount(postId: number): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/api/comments/?post_id=${postId}`, { headers: this.getAuthHeaders() })
      .pipe(map(response =>  response.count));
  }

  // 📌 Obtener comentarios paginados
  getComments(postId: number, page: number = 1, limit: number = 5): Observable<any> {
    const params = new HttpParams()
      .set('post_id', postId.toString()) // ✅ Parámetro corregido
      .set('limit', limit.toString())
      .set('offset', ((page - 1) * limit).toString());

    return this.http.get<any>(`${this.apiUrl}/api/comments/`, { params, headers: this.getAuthHeaders() });
  }

  // 📌 Agregar un comentario
  addComment(postId: number, content: string): Observable<any> {
    const body = { blog_post: postId, content };
    return this.http.post(`${this.apiUrl}/api/comments/${postId}/`, body, { headers: this.getAuthHeaders() });
  }

  // 📌 Eliminar un post
  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/posts/${postId}/delete/`, { headers: this.getAuthHeaders() });
  }

  // 📌 Actualizar un post
  updatePost(postId: number, postData: Partial<Post>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/posts/${postId}/update/`, postData, {
      headers: this.getAuthHeaders(),
    });
  }


  // 📌 Crear un post
  createPost(
    title: string,
    content: string,
    category: number,
    public_permission: string,
    authenticated_permission: string,
    author_permission: string,
    team_permission: string
  ): Observable<any> {
    const postData = {
      title,
      content,
      category,
      public_permission,
      authenticated_permission,
      author_permission,
      team_permission
    };

    return this.http.post(`${this.apiUrl}/api/posts/create/`, postData, { headers: this.getAuthHeaders() });
  }
}
