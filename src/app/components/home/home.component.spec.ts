import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, ElementRef, importProvidersFrom } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { throwError } from 'rxjs';
import { PaginatedResponse, Post } from '../../models/post.model';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Like } from '../../models/like.model';


describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let postServiceMock: jasmine.SpyObj<PostService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let changeDetectorMock: jasmine.SpyObj<ChangeDetectorRef>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let testPost: any;


  beforeEach(async () => {
    // Crear mocks con SpyObj
    postServiceMock = jasmine.createSpyObj('PostService', [
      'getPosts', 'getCommentCount', 'addLike', 'removeLike', 'deletePost', 'addComment', 'getLikes'
    ]);

    authServiceMock = jasmine.createSpyObj('AuthService', [
      'getUserId', 'getUsername', 'getUserTeam', 'login', 'logout'
    ], ['isAuthenticated$', 'user$']); // Mock de observables

    // Configurar respuestas por defecto
    postServiceMock.getPosts.and.returnValue(of({
      results: [],
      count: 0,
      total_pages: 1,
      current_page: 1,
      page_size: 10,
      next: null,
      previous: null
    }));

    postServiceMock.getCommentCount.and.returnValue(of(5));
    postServiceMock.addLike.and.returnValue(of({ success: true }));
    postServiceMock.removeLike.and.returnValue(of({ success: true }));
    postServiceMock.deletePost.and.returnValue(of({}));
    postServiceMock.addComment.and.returnValue(of({}));

    authServiceMock.getUserId.and.returnValue(1);
    authServiceMock.getUsername.and.returnValue('testuser');
    authServiceMock.getUserTeam.and.returnValue('TeamA');


       // 🔥 Inicializar BehaviorSubject con `false` (usuario NO autenticado)
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

       // 🔥 Configurar `isAuthenticated$` para usar el BehaviorSubject
    Object.defineProperty(authServiceMock, 'isAuthenticated$', { get: () => isAuthenticatedSubject.asObservable() });
    // Mock de observables en AuthService

    Object.defineProperty(authServiceMock, 'user$', { get: () => of(null) });

    changeDetectorMock = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);



    await TestBed.configureTestingModule({

      imports: [HomeComponent, ReactiveFormsModule],
      providers: [
        importProvidersFrom(HttpClientTestingModule),
        { provide: PostService, useValue: postServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ChangeDetectorRef, useValue: changeDetectorMock },
        { provide: FormBuilder, useValue: new FormBuilder() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => 'mockValue' } },
            params: of({}), // Agregar `params` para evitar errores en `ngOnInit()`
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    testPost = {
      id: 1,
      title: 'Post de prueba',
      author: 'Autor1',
      excerpt: 'Resumen del post',
      content: 'Contenido completo',
      timestamp: new Date().toISOString(),
      likes_count: 3,
      comment_count: 2,
      team: 'Equipo A',
      public_permission: 'NONE',
      authenticated_permission: 'READ',
      team_permission: 'READ',
      liked_by_user: true,
      author_permission: 'READ_EDIT',
      comments: [],
      likes: [{ user: 'user1' }, { user: 'user2' }]  // Mock de likes
    };


    fixture.detectChanges(); // Ejecuta `ngOnInit()`


  });




  it('debe cargar posts correctamente', () => {
    expect(postServiceMock.getPosts).toHaveBeenCalled();
  });

  it('no debe mostrar usuario si no está autenticado', () => {
    expect(component.isAuthenticated).toBeFalse();
    expect(component.currentUser).toBeNull();
  });

  it('debe añadir un like si el post no ha sido likeado', () => {
    const post = { id: 1, liked_by_user: false, likes_count: 10 } as any;

    postServiceMock.addLike.and.returnValue(of({ success: true }));

    component.isAuthenticated = true; // Asegurar autenticación
    component.toggleLike(post);


    expect(postServiceMock.addLike).toHaveBeenCalledTimes(1);
    expect(postServiceMock.addLike).toHaveBeenCalledWith(post.id);
    expect(post.likes_count).toBe(11);
    expect(post.liked_by_user).toBeTrue();
  });

  it('debe quitar un like si el post ya ha sido likeado', () => {
    const post = { id: 2, liked_by_user: true, likes_count: 5 } as any;

    postServiceMock.removeLike.and.returnValue(of({ success: true }));

    component.isAuthenticated = true; // Asegurar autenticación
    component.toggleLike(post);

    expect(postServiceMock.removeLike).toHaveBeenCalledTimes(1);
    expect(postServiceMock.removeLike).toHaveBeenCalledWith(post.id);
    expect(post.likes_count).toBe(4);
    expect(post.liked_by_user).toBeFalse();
  });

  it('debe obtener y mostrar los likes de un post', () => {
    const post = { id: 1 } as any;
    const mockResponse = {
      results: [{ id: 1, user: 'testuser', blog_post: '1', timestamp: new Date().toISOString() }],
      total_pages: 3,
      current_page: 1,
      next: null,
      previous: null,
    };

    postServiceMock.getLikes.and.returnValue(of(mockResponse));

    spyOn(component['cd'], 'detectChanges'); // 🔥 Asegurar el spy antes de llamar `showLikes`

    component.showLikes(post);

    expect(postServiceMock.getLikes).toHaveBeenCalledWith(post.id, component.likes_per_page, 0);
    expect(component.selectedPostLikes).toEqual(mockResponse.results);
    expect(component.totalLikesPages).toBe(3);
    expect(component.showLikesForPostId).toBe(post.id);
    expect(component['cd'].detectChanges).toHaveBeenCalled(); // ✅ Verifica que se llame
  });


  it('debe retroceder a la página anterior de likes si no está en la primera', () => {
    const post = { id: 1 } as any;
    component.selectedPostLikesPage = 2;
    spyOn(component, 'showLikes')

    component.previousLikesPage(post);

    expect(component.selectedPostLikesPage).toBe(1); // 🔥 Debe haber cambiado a 1
    expect(component.showLikes).toHaveBeenCalledWith(post); // 🔥 Se debe llamar showLikes()
  });

  it('no debe retroceder si ya está en la primera página de likes', () => {
    const post = { id: 1 } as any;
    component.selectedPostLikesPage = 1;
    spyOn(component, 'showLikes');

    component.previousLikesPage(post);

    expect(component.selectedPostLikesPage).toBe(1); // 🔥 No debe cambiar
    expect(component.showLikes).not.toHaveBeenCalled(); // 🔥 No se debe llamar showLikes()
  });

  it('debe avanzar a la siguiente página de likes si no está en la última', () => {
    const post = { id: 1 } as any;
    component.selectedPostLikesPage = 1;
    component.totalLikesPages = 3; // 🔥 Simula que hay 3 páginas
    spyOn(component, 'showLikes')

    component.nextLikesPage(post);

    expect(component.selectedPostLikesPage).toBe(2); // 🔥 Debe haber cambiado a 2
    expect(component.showLikes).toHaveBeenCalledWith(post); // 🔥 Se debe llamar showLikes()
  });

  it('no debe avanzar si ya está en la última página de likes', () => {
    const post = { id: 1 } as any;
    component.selectedPostLikesPage = 3;
    component.totalLikesPages = 3;
    spyOn(component, 'showLikes');

    component.nextLikesPage(post);

    expect(component.selectedPostLikesPage).toBe(3); // 🔥 No debe cambiar
    expect(component.showLikes).not.toHaveBeenCalled(); // 🔥 No se debe llamar showLikes()
  });

  it('debe eliminar un post cuando el usuario confirma', async () => {
    const post = { id: 1 } as any;
    component.posts = [post, { id: 2 } as any]; // 🔥 Lista inicial de posts

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
      isConfirmed: true, // Simula que el usuario confirma
      isDenied: false,
      isDismissed: false,
      value: null
    } as SweetAlertResult<any>));

    postServiceMock.deletePost.and.returnValue(of({})); // Simula éxito
    spyOn(component.cd, 'detectChanges'); // Espía `detectChanges`

    await component.deletePost(post); // 🔥 Usa `await` para esperar la ejecución completa

    expect(Swal.fire).toHaveBeenCalled(); // 🔥 Debe mostrar la alerta
    expect(postServiceMock.deletePost).toHaveBeenCalledWith(post.id); // 🔥 Debe llamarse deletePost con el ID correcto
  });

  it('no debe eliminar el post si el usuario cancela', async () => {
    const post = { id: 1 } as any;
    component.posts = [post, { id: 2 } as any];

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
      isConfirmed: false, // ❌ Usuario cancela
      isDenied: false,
      isDismissed: true
    } as SweetAlertResult<any>));

    await component.deletePost(post); // Usa `await` si `deletePost` es async

    expect(postServiceMock.deletePost).not.toHaveBeenCalled(); // 🔥 No debe eliminar nada
  });



  it('debe manejar error al eliminar un post', async () => {
    const post = { id: 1 } as any;
    component.posts = [post, { id: 2 } as any];

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
      value: null
    } as SweetAlertResult<any>));

    spyOn(console, 'error').and.callThrough()

    // 🔥 Simula que la llamada a deletePost falla con un error
    postServiceMock.deletePost.and.returnValue(throwError(() => new Error('Error al eliminar')));

    await component.deletePost(post); // 🔥 Asegurar que la función se ejecuta correctamente

    expect(console.error).toHaveBeenCalled(); // 🔥 Debe registrar el error en consola
    expect(Swal.fire).toHaveBeenCalledWith('Error', 'No se pudo eliminar el post.', 'error'); // 🔥 Debe mostrar mensaje de error
  });

  it('debe cargar correctamente los conteos de comentarios para cada post', () => {
    component.posts = [
      { id: 1, comment_count: 0 } as any,
      { id: 2, comment_count: 0 } as any
    ];

    // Simula que getCommentCount devuelve valores específicos
    postServiceMock.getCommentCount.and.callFake((postId: number) => {
      return of(postId === 1 ? 5 : 8); // Para el post 1 devuelve 5, para el post 2 devuelve 8
    });

    component.loadCommentCounts(); // Ejecutar la función

    expect(postServiceMock.getCommentCount).toHaveBeenCalledTimes(2);
    expect(postServiceMock.getCommentCount).toHaveBeenCalledWith(1);
    expect(postServiceMock.getCommentCount).toHaveBeenCalledWith(2);
    expect(component.posts[0].comment_count).toBe(5);
    expect(component.posts[1].comment_count).toBe(8);
  });

  it('debe asignar 0 comentarios si hay un error en la carga', () => {
    component.posts = [{ id: 1, comment_count: 0 } as any];

    // Simula un error en la llamada a getCommentCount
    postServiceMock.getCommentCount.and.returnValue(throwError(() => new Error('Error al obtener comentarios')));

    spyOn(console, 'error'); // Espía console.error para verificar que se registra el error

    component.loadCommentCounts();

    expect(postServiceMock.getCommentCount).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalled(); // Verifica que el error se haya registrado
    expect(component.posts[0].comment_count).toBe(0); // Debe asignar 0 en caso de error
  });

  it('debe alternar el estado de showLikesForPostId correctamente', () => {
    const post = { id: 1 } as Post;

    component.toggleLikesList(post);
    expect(component.showLikesForPostId).toBe(1);

    component.toggleLikesList(post);
    expect(component.showLikesForPostId).toBeNull();

    const post2 = { id: 2 } as Post;
    component.toggleLikesList(post2);
    expect(component.showLikesForPostId).toBe(2);
  });

  it('no debe permitir edición/borrar si el usuario no es el autor, no pertenece al equipo y no hay permisos de edición', () => {
      const post: Post = {
        id: 1,
        title: 'Título de prueba',
        content: 'Contenido de prueba',
        timestamp: new Date().toISOString(),
        author: 'otroUsuario', // El usuario actual NO es el autor
        team_permission: 'NONE' as 'NONE' | 'READ', // Asegurar el tipo correcto
        authenticated_permission: 'NONE' as 'NONE' | 'READ', // Asegurar el tipo correcto
        public_permission: 'NONE' as 'NONE' | 'READ', // Asegurar el tipo correcto
        team: 'teamB', // No pertenece al equipo del usuario actual
        comment_count: 0,
        excerpt: '',
        likes_count: 0,
        liked_by_user: false,
        author_permission: 'READ_EDIT', // El autor solo puede leer, no editar
        comments: []
      };
      component.isAuthenticated = true;
      component.currentUser = {
        id: 1, // ✅ Agregar ID
        team: 'teamA', // ✅ Agregar equipo
        username: 'testUser'
    };



      authServiceMock.getUsername.and.returnValue('testUser');
      authServiceMock.getUserTeam.and.returnValue('teamA');

      expect(component.canEditOrDelete(post)).toBeFalse();
    });


    it('debe permitir edición/borrar si el usuario pertenece al equipo y el equipo tiene permiso de edición', () => {
      const post: Post = {
        id: 1,
        title: 'Título de prueba',
        content: 'Contenido de prueba',
        timestamp: new Date().toISOString(),
        author: 'otroUsuario',
        team_permission: 'READ_EDIT' as 'NONE' | 'READ' | 'READ_EDIT', // 🔹 Se cambió a 'READ_EDIT'
        authenticated_permission: 'NONE' as 'NONE' | 'READ' | 'READ_EDIT',
        public_permission: 'NONE' as 'NONE' | 'READ',
        team: 'teamA',
        comment_count: 0,
        excerpt: '',
        likes_count: 0,
        liked_by_user: false,
        author_permission: 'READ_EDIT',
        comments: []
      };
      component.isAuthenticated = true;
      component.currentUser = {
        id: 1, // ✅ Agregar ID
        team: 'teamA', // ✅ Agregar equipo
        username: 'otroUsuario'
    };


      authServiceMock.getUsername.and.returnValue('otroUsuario'); // 🔹 Usuario NO es el autor
      authServiceMock.getUserTeam.and.returnValue('teamA'); // 🔹 Usuario pertenece al equipo

      expect(component.canEditOrDelete(post)).toBeTrue(); // 🔹 Ahora sí debería ser TRUE
    });



    it('debe permitir edición/borrar si los usuarios autenticados tienen permiso de edición', () => {
      const post: Post = {
        id: 1,
        title: 'Título de prueba',
        content: 'Contenido de prueba',
        timestamp: new Date().toISOString(),
        author: 'otroUsuario',
        team_permission: 'READ_EDIT',
        authenticated_permission: 'READ_EDIT', // Usuarios autenticados pueden editar
        public_permission: 'NONE',
        team: 'teamB',
        comment_count: 0,
        excerpt: '',
        likes_count: 0,
        liked_by_user: false,
        author_permission: 'READ_EDIT',
        comments: []
      };

      component.isAuthenticated = true;
      component.currentUser = {
        id: 1, // ✅ Agregar ID
        team: 'teamA', // ✅ Agregar equipo
        username: 'testUser'
    };


      authServiceMock.getUsername.and.returnValue('testUser');
      authServiceMock.getUserTeam.and.returnValue('teamA');
      expect(component.canEditOrDelete(post)).toBeTrue();
    });

    it('debe mostrar el botón "Crear Nuevo Post" solo si el usuario está autenticado', async () => {
      // 🔥 Simular que el usuario está autenticado
      isAuthenticatedSubject.next(true);
      fixture.detectChanges();
      await fixture.whenStable();

      let button = fixture.nativeElement.querySelector('.btn-new-post');
      expect(button).not.toBeNull(); // ✅ Debe existir el botón

      // 🔥 Simular que el usuario NO está autenticado
      isAuthenticatedSubject.next(false);
      fixture.detectChanges();
      await fixture.whenStable();

      // 🔥 Forzar la detección de cambios manualmente
      fixture.componentInstance.cd.detectChanges();
      fixture.detectChanges();
      await fixture.whenStable();

      button = fixture.nativeElement.querySelector('.btn-new-post');
      expect(button).toBeNull(); // ✅ Ahora sí debería desaparecer el botón
    });

    it('debe mostrar el encabezado "Blog Posts"', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title).not.toBeNull();
      expect(title.textContent).toContain('Blog Posts');
    });

    it('no debe mostrar posts si la lista está vacía', () => {
      component.posts = []; // Simulamos que no hay posts
      fixture.detectChanges();

      const posts = fixture.nativeElement.querySelectorAll('.post-card');
      expect(posts.length).toBe(0);
    });

    it('deberia mostrar los botones de editar/eliminar si esta autenticado', () => {
      // Cambiar el estado de autenticación a `true`
      isAuthenticatedSubject.next(true);  // Simula que el usuario está autenticado

      // Ejecutar el cambio de detección de nuevo
      fixture.detectChanges();

      // Comprobar si el botón está presente en el DOM
      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();  // El botón debe ser visible
    });

    it('no deberia los botones de editar/eliminar cuando no esta autenticado', () => {
      // Cambiar el estado de autenticación a `false`
      isAuthenticatedSubject.next(false);  // Simula que el usuario NO está autenticado

      // Ejecutar el cambio de detección de nuevo
      fixture.detectChanges();

      // Comprobar que el botón no está presente en el DOM
      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeFalsy();  // El botón no debe ser visible
    });



it('no deberia mostrar los likes cuando no hay match de post_id', () => {
  // Asignar un id diferente al de `testPost`
  component.showLikesForPostId = 999; // Un id diferente

  fixture.detectChanges();  // Detectar cambios

  // Obtener los elementos de la lista de likes
  const likesList = fixture.debugElement.queryAll(By.css('.likes-list li'));

  // Verificar que no haya elementos en la lista de likes
  expect(likesList.length).toBe(0);
});

it('debe obtener y mostrar los likes de un post', () => {
  const post = { id: 1 } as any;
  const mockResponse = {
    results: [{ id: 1, user: 'testuser', blog_post: '1', timestamp: new Date().toISOString() }],
    total_pages: 3,
    current_page: 1,
    next: null,
    previous: null,
  };

  postServiceMock.getLikes.and.returnValue(of(mockResponse));

  spyOn(component.cd, 'detectChanges') // Espiar detectChanges()

  component.showLikes(post);

  expect(postServiceMock.getLikes).toHaveBeenCalledWith(post.id, component.likes_per_page, 0);
  expect(component.selectedPostLikes).toEqual(mockResponse.results);
  expect(component.totalLikesPages).toBe(3);
  expect(component.showLikesForPostId).toBe(post.id);
  expect(component.cd.detectChanges).toHaveBeenCalled(); // ✅ Verificar cambio en la vista
});

it('debe cambiar de página y cargar los posts', () => {
  const mockResponse: PaginatedResponse = {
    count: 10,
    total_pages: 5,
    current_page: 2,
    page_size: 2,
    next: "http://api.com/posts?page=3",
    previous: "http://api.com/posts?page=1",
    results: [
      {
        id: 1,
        title: "Post 1",
        content: "Contenido del post 1",
        author: "Usuario 1",
        timestamp: "2025-02-27 12:00:00",
        comment_count: 3,
        excerpt: "Contenido del post 1...",
        team: "Equipo A",
        likes_count: 5,
        liked_by_user: false,
        public_permission: "READ",
        authenticated_permission: "READ_EDIT",
        team_permission: "READ_EDIT",
        author_permission: "READ_EDIT",
        comments: [],
        newComment: "",
        showCommentBox: false,
      },
      {
        id: 2,
        title: "Post 2",
        content: "Contenido del post 2",
        author: "Usuario 2",
        timestamp: "2025-02-27 12:30:00",
        comment_count: 5,
        excerpt: "Contenido del post 2...",
        team: "Equipo B",
        likes_count: 8,
        liked_by_user: true,
        public_permission: "READ",
        authenticated_permission: "READ_EDIT",
        team_permission: "READ_EDIT",
        author_permission: "READ_EDIT",
        comments: [],
        newComment: "",
        showCommentBox: false,
      }
    ],
  };

  postServiceMock.getPosts.and.returnValue(of(mockResponse));
  component.pageSize = 2;
  component.pageChanged(2);

  expect(component.currentPage).toBe(2);
  expect(component.posts).toEqual(mockResponse.results); // ✅ Verifica que los posts se actualizan
  expect(component.totalItems).toBe(mockResponse.count); // ✅ Verifica que `count` se asigna correctamente
  expect(postServiceMock.getPosts).toHaveBeenCalledWith(2, component.pageSize);
});

















  });












