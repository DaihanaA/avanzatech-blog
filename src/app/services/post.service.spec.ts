import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PostService } from './post.service';
import { environment } from '../../environments/environment';
import { PaginatedResponse, Post } from '../models/post.model';
import { importProvidersFrom } from '@angular/core';
import { AuthService } from './auth.service';

describe('PostService', () => {
  let service: PostService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [PostService,
        importProvidersFrom(HttpClientTestingModule),
      ]
    });

    service = TestBed.inject(PostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ✅ Verifica que no haya peticiones pendientes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch paginated posts', () => {
    const mockResponse: PaginatedResponse = {
      count: 20,
      total_pages: 2,
      current_page: 1,
      page_size: 10,
      next: `${environment.apiUrl}/api/posts/?limit=10&offset=10`,
      previous: null,
      results: [
        {
          id: 1,
          title: 'Post de prueba',
          content: 'Contenido de prueba',
          author: 'Usuario de prueba',  // ✅ Nombre del autor en lugar de ID
          timestamp: '2025-02-20 12:00:00',  // ✅ Formato de fecha correcto
          comment_count: 5,
          excerpt: 'Resumen del post...',
          team: 'Grupo de prueba',  // ✅ Nombre del equipo
          likes_count: 10,
          liked_by_user: false,  // ✅ Indicador si el usuario ha dado like
          public_permission: 'READ',
          authenticated_permission: 'READ',
          team_permission: 'NONE',
          author_permission: 'READ_EDIT',
          comments: [],  // ✅ Lista de comentarios (puede estar vacía)
          newComment: '',
          showCommentBox: false
        }
      ]
    };

    service.getPosts(1, 10).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/?limit=10&offset=0`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse); // Simula respuesta del servidor
  });



  it('should get a post by ID', () => {
    const mockPost: Post = {
      id: 1,
      title: 'Post de prueba',
      content: 'Contenido de prueba',
      author: 'Usuario de prueba', // ✅ Requerido
      timestamp: '2025-02-20 12:00:00', // ✅ Requerido
      comment_count: 5,
      excerpt: 'Resumen del post...',
      team: 'Grupo de prueba', // ✅ Requerido
      likes_count: 10,
      liked_by_user: false,
      public_permission: 'READ',
      authenticated_permission: 'READ',
      team_permission: 'NONE',
      author_permission: 'READ_EDIT',
      comments: [], // ✅ Requerido
      newComment: '',
      showCommentBox: false
    };

    service.getPostById(1).subscribe((post) => {
      expect(post).toEqual(mockPost);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPost);
  });


  it('should add a like to a post', () => {
    service.addLike(1).subscribe((response) => {
      expect(response).toEqual({});
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/likes/1/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should remove a like from a post', () => {
    service.removeLike(1).subscribe((response) => {
      expect(response).toEqual({});
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/likes/1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should create a new post', () => {
    const newPost = {
      title: 'Nuevo post',
      content: 'Contenido del nuevo post',
      team: 'Grupo de prueba',
      public_permission: "READ" as 'READ' | 'NONE',
      authenticated_permission: "READ" as 'READ' | 'NONE' | 'READ_EDIT',
      team_permission: "READ" as 'READ' | 'NONE' | 'READ_EDIT'
    };

    const createdPost: Post = {
      id: 2,
      title: newPost.title,
      content: newPost.content,
      author: 'Usuario de prueba',
      timestamp: '2025-02-20 14:00:00',
      comment_count: 0,
      excerpt: newPost.content.substring(0, 200),
      team: newPost.team,
      likes_count: 0,
      liked_by_user: false,
      public_permission: newPost.public_permission,
      authenticated_permission: newPost.authenticated_permission,
      team_permission: newPost.team_permission,
      author_permission: 'READ_EDIT',
      comments: [],
      newComment: '',
      showCommentBox: false
    };

    service.createPost(
      newPost.title,
      newPost.content,
      1,  // ✅ Se está enviando 'category', así que debe incluirse en la comparación
      newPost.public_permission,
      newPost.authenticated_permission,
      'READ_EDIT',
      newPost.team_permission
    ).subscribe((post) => {
      expect(post).toEqual(jasmine.objectContaining({
        id: jasmine.any(Number),  // ✅ Permitir cualquier ID
        title: newPost.title,
        content: newPost.content,
        team: newPost.team,
        public_permission: newPost.public_permission,
        authenticated_permission: newPost.authenticated_permission,
        team_permission: newPost.team_permission
      }));
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/create/`);
    expect(req.request.method).toBe('POST');

    // ✅ Validar que se envían los campos correctos
    expect(req.request.body).toEqual({
      title: newPost.title,
      content: newPost.content,
      category: 1,  // ✅ Debe estar si se pasa en createPost()
      public_permission: newPost.public_permission,
      authenticated_permission: newPost.authenticated_permission,
      author_permission: "READ_EDIT",  // ✅ Se está enviando explícitamente
      team_permission: newPost.team_permission
    });

    req.flush(createdPost);
  });

  it('should update a post', () => {
    const updatedData = { title: 'Título actualizado', content: 'Contenido actualizado' };
    const updatedPost: Post = {
      id: 1,
      title: updatedData.title,
      content: updatedData.content,
      author: 'Usuario de prueba',
      timestamp: '2025-02-20 14:30:00',
      comment_count: 5,
      excerpt: updatedData.content.substring(0, 200),
      team: 'Grupo de prueba',
      likes_count: 10,
      liked_by_user: false,
      public_permission: 'READ',
      authenticated_permission: 'READ',
      team_permission: 'NONE',
      author_permission: 'READ_EDIT',
      comments: [],
      newComment: '',
      showCommentBox: false
    };

    service.updatePost(1, updatedData).subscribe((post) => {
      expect(post).toEqual(updatedPost);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/update/`);
    expect(req.request.method).toBe('PATCH'); // Dependiendo de la API, podría ser PUT o PATCH
    expect(req.request.body).toEqual(updatedData);
    req.flush(updatedPost);
  });

  it('should delete a post', () => {
    service.deletePost(1).subscribe((response) => {
      expect(response).toEqual({});
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/delete/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should fetch comments for a post', () => {
    const mockComments = [
      { id: 1, content: 'Primer comentario', author: 'Usuario 1', timestamp: '2025-02-20 15:00:00' },
      { id: 2, content: 'Segundo comentario', author: 'Usuario 2', timestamp: '2025-02-20 15:05:00' }
    ];

    service.getComments(1, 1, 10).subscribe((comments) => {
      expect(comments).toEqual(mockComments);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/comments/?post_id=1&limit=10&offset=0`);
    expect(req.request.method).toBe('GET');
    req.flush(mockComments);
  });

  it('should handle API errors when creating a post', () => {
    const newPost = { title: 'Nuevo post', content: 'Contenido...', team: 'Grupo de prueba', public_permission: 'READ', authenticated_permission: 'READ', team_permission: 'READ' };

    service.createPost(newPost.title, newPost.content, 1, newPost.public_permission, newPost.authenticated_permission, 'READ_EDIT', newPost.team_permission).subscribe({
      next: () => fail('Expected an error, but got success'),
      error: (error) => expect(error.status).toBe(500)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/create/`);
    req.flush('Error interno del servidor', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should fetch a post by ID', () => {
    const mockPost: Post = { id: 1, title: 'Post de prueba', content: 'Contenido...', author: 'Usuario', timestamp: '2025-02-20', comment_count: 0, excerpt: 'Contenido...', team: 'Grupo A', likes_count: 10, liked_by_user: false, public_permission: 'READ', authenticated_permission: 'READ', team_permission: 'READ', author_permission: 'READ_EDIT', comments: [] };

    service.getPostById(1).subscribe(post => {
      expect(post).toEqual(mockPost);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPost);
  });

  it('should return 404 when post is not found', () => {
    service.getPostById(999).subscribe({
      next: () => fail('Expected an error, but got success'),
      error: (error) => expect(error.status).toBe(404)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/999/`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('should return 403 when user has no permission to update', () => {
    service.updatePost(1, { title: 'Nuevo título' }).subscribe({
      next: () => fail('Expected an error, but got success'),
      error: (error) => expect(error.status).toBe(403)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/update/`);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('should return 403 when user has no permission to delete', () => {
    service.deletePost(1).subscribe({
      next: () => fail('Expected an error, but got success'),
      error: (error) => expect(error.status).toBe(403)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/posts/1/delete/`);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('should return an empty list when there are no comments', () => {
    service.getComments(1).subscribe(comments => {
      expect(comments.length).toBe(0);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/comments/?post_id=1&limit=5&offset=0`);
    req.flush([]);
  });




});
