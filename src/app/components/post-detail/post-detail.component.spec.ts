import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PostDetailComponent } from './post-detail.component';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';  // ✅ Importar FormsModule



describe('PostDetailComponent', () => {
  let component: PostDetailComponent;
  let fixture: ComponentFixture<PostDetailComponent>;
  let postServiceMock: jasmine.SpyObj<PostService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let changeDetectorMock: jasmine.SpyObj<ChangeDetectorRef>;


  beforeEach(async () => {
    postServiceMock = jasmine.createSpyObj('PostService', ['getPostById', 'getComments', 'addComment']);
    authServiceMock = jasmine.createSpyObj('AuthService', [], { isAuthenticated$: new BehaviorSubject<boolean>(true) });
    changeDetectorMock = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    const activatedRouteMock = { paramMap: of(convertToParamMap({ id: '1' })) }; // ✅ Usar convertToParamMap
    postServiceMock.getPostById.and.returnValue(of({
      id: 1,
      title: "Título de prueba",
      content: "Contenido de prueba",
      author: "Autor de prueba",
      team: "Equipo de prueba",
      timestamp: "2025-02-24T12:00:00Z",
      likes_count: 10,
      comment_count: 5,
      excerpt: "Este es un resumen...",
      comments: [], // Lista vacía de comentarios
      liked_by_user: false, // Puede ser true si el usuario ha dado like
      public_permission: "READ", // O el valor que uses en tu app
      authenticated_permission: "READ", // Ejemplo
      team_permission: "READ", // Ejemplo
      author_permission: "READ_EDIT"
    }));

    postServiceMock.getComments.and.returnValue(of({ results: [], count: 0 }));
    postServiceMock.addComment.and.returnValue(of({ success: true }));
    postServiceMock.getPostById.and.returnValue(of({
      id: 1,
      title: "Título de prueba",
      content: "Contenido de prueba",
      author: "Autor de prueba",
      timestamp: "2025-02-24 12:00:00",
      comment_count: 5,
      excerpt: "Este es un resumen...",
      team: "Equipo de prueba",
      likes_count: 10,
      liked_by_user: false,
      public_permission: "READ",
      authenticated_permission: "READ_EDIT",
      team_permission: "READ_EDIT",
      author_permission: "READ_EDIT",
      comments: [],
    }));



    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: PostService, useValue: postServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ChangeDetectorRef, useValue: changeDetectorMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('debe cargar el post correctamente', () => {
    expect(component.post).toBeTruthy();
    expect(component.post.title).toBe('Título de prueba');
    expect(postServiceMock.getPostById).toHaveBeenCalledWith(1);
  });

  it('debe actualizar el estado de autenticación', () => {
    expect(component.isAuthenticated).toBeTrue();
  });

  it('debe cargar los comentarios paginados', fakeAsync(() => {
    postServiceMock.getComments.and.returnValue(of({ results: [{ content: 'Comentario 1' }], count: 5 }));
    component.loadComments(1);
    tick();
    expect(component.comments.length).toBe(1);
    expect(component.comments[0].content).toBe('Comentario 1');
  }));

  it('debe agregar un comentario correctamente', fakeAsync(() => {
    component.newComment = 'Nuevo comentario';
    postServiceMock.addComment.and.returnValue(of({ content: 'Nuevo comentario' }));
    component.addComment();
    tick();
    expect(component.comments.length).toBe(1);
    expect(component.comments[0].content).toBe('Nuevo comentario');
  }));

  it('debe evitar agregar un comentario vacío', () => {
    component.newComment = '';
    component.addComment();
    expect(postServiceMock.addComment).not.toHaveBeenCalled();
  });

  it('debe limpiar el cuadro de texto al cancelar un comentario', () => {
    component.newComment = 'Comentario a cancelar';
    component.cancelComment();
    expect(component.newComment).toBe('');
  });

  it('debe vincular el campo de comentario con el modelo de datos', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // Simula el ciclo de detección de cambios

    const textarea = fixture.nativeElement.querySelector('textarea'); // Seleccionar el campo de comentario
    textarea.value = 'Comentario de prueba';
    textarea.dispatchEvent(new Event('input')); // Simular la entrada del usuario

    fixture.detectChanges();
    tick();

    expect(component.newComment).toBe('Comentario de prueba'); // ✅ Verificar que el modelo se actualiza
  }));

  it('debe vincular el textarea con newComment', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const textarea = fixture.nativeElement.querySelector('textarea.comment-input');
    textarea.value = 'Comentario de prueba';
    textarea.dispatchEvent(new Event('input')); // Simula la entrada del usuario

    fixture.detectChanges();
    tick();

    expect(component.newComment).toBe('Comentario de prueba'); // ✅ Verificar el enlace con ngModel
  }));
  it('debe deshabilitar el botón de comentar si el comentario está vacío', fakeAsync(() => {
    component.newComment = ''; // Comienza vacío
    fixture.detectChanges();
    tick();

    const commentButton = fixture.nativeElement.querySelector('button.comment-button');

    expect(commentButton.disabled).toBeTrue(); // ✅ Debe estar deshabilitado
  }));

  it('debe agregar un comentario al enviar', fakeAsync(() => {
    component.newComment = 'Nuevo comentario de prueba';
    postServiceMock.addComment.and.returnValue(of({ content: 'Nuevo comentario de prueba', user: 'UsuarioPrueba', timestamp: '2025-02-24T12:30:00Z' }));

    fixture.detectChanges();
    tick();

    const commentButton = fixture.nativeElement.querySelector('button.comment-button');
    commentButton.click(); // Simular clic

    fixture.detectChanges();
    tick();

    expect(postServiceMock.addComment).toHaveBeenCalled(); // ✅ API llamada
    expect(component.comments.length).toBe(1);
    expect(component.comments[0].content).toBe('Nuevo comentario de prueba'); // ✅ Se agregó el comentario
  }));

  it('debe limpiar el comentario al cancelar', fakeAsync(() => {
    component.newComment = 'Comentario a cancelar';
    fixture.detectChanges();
    tick();

    const cancelButton = fixture.nativeElement.querySelector('button.cancel-button');
    cancelButton.click(); // Simular clic en "Cancelar"

    fixture.detectChanges();
    tick();

    expect(component.newComment).toBe(''); // ✅ Debe estar vacío
  }));
  it('debe cargar la página siguiente de comentarios', fakeAsync(() => {
    component.nextPageUrl = 'mockUrl'; // Simula que hay una página siguiente
    postServiceMock.getComments.and.returnValue(of({ results: [{ content: 'Comentario en página 2' }], count: 5 }));

    fixture.detectChanges();
    tick();

    const nextPageButton = fixture.nativeElement.querySelector('button:nth-of-type(2)'); // Botón "Siguiente →"
    nextPageButton.click(); // Simular clic

    fixture.detectChanges();
    tick();

    expect(postServiceMock.getComments).toHaveBeenCalled(); // ✅ API llamada para obtener más comentarios
    expect(component.comments.length).toBe(1);
    expect(component.comments[0].content).toBe('Comentario en página 2'); // ✅ Se cargaron nuevos comentarios
  }));

  it('no debe mostrar la caja de comentarios si el usuario no está autenticado', () => {
    // Simular que el usuario no está autenticado
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(false);

    fixture.detectChanges(); // Forzar actualización de la vista

    const commentBox = fixture.nativeElement.querySelector('.comment-box');
    expect(commentBox).toBeNull(); // Verifica que la caja de comentarios no esté presente
  });

  it('debe mostrar la caja de comentarios si el usuario está autenticado', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    const commentBox = fixture.nativeElement.querySelector('.comment-box');
    expect(commentBox).not.toBeNull(); // Verifica que la caja de comentarios aparece
  });

  it('debe deshabilitar el botón de comentar si el comentario está vacío', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    const commentInput = fixture.nativeElement.querySelector('.comment-input');
    commentInput.value = ''; // Simular que el usuario no ha escrito nada
    commentInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const commentButton = fixture.nativeElement.querySelector('.comment-button');
    expect(commentButton.disabled).toBeTrue();
  });

  it('debe habilitar el botón de comentar si el comentario no está vacío', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    const commentInput = fixture.nativeElement.querySelector('.comment-input');
    commentInput.value = 'Este es un comentario de prueba';
    commentInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const commentButton = fixture.nativeElement.querySelector('.comment-button');
    expect(commentButton.disabled).toBeFalse();
  });

  it('debe llamar a addComment() cuando se envía un comentario', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    spyOn(component, 'addComment').and.callThrough();

    const commentInput = fixture.nativeElement.querySelector('.comment-input');
    commentInput.value = 'Comentario de prueba';
    commentInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const commentButton = fixture.nativeElement.querySelector('.comment-button');
    commentButton.click();
    fixture.detectChanges();

    expect(component.addComment).toHaveBeenCalled();
  });

  it('debe limpiar el campo de comentario después de enviar', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    const commentInput = fixture.nativeElement.querySelector('.comment-input');
    commentInput.value = 'Comentario de prueba';
    commentInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    component.addComment(); // Simular envío del comentario
    fixture.detectChanges();

    expect(component.newComment).toBe('');
  });

  it('debe llamar a cancelComment() cuando se cancela el comentario', () => {
    (authServiceMock.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    fixture.detectChanges();

    spyOn(component, 'cancelComment').and.callThrough();

    const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
    cancelButton.click();
    fixture.detectChanges();

    expect(component.cancelComment).toHaveBeenCalled();
  });

  it('debe mostrar el título, autor, equipo y contenido del post', async () => {
    component.post = {
      title: 'Título de prueba',
      author: 'Autor de prueba',
      team: 'Equipo de prueba',
      content: '<p>Contenido de prueba</p>'
    };

    fixture.detectChanges(); // 🚀 Forzar renderizado

    await fixture.whenStable(); // ⏳ Esperar actualización del DOM

    const titleElement: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(titleElement.textContent).toContain('Título de prueba');
  });


  it('debe mostrar los comentarios cuando hay al menos uno', () => {
    component.comments = [
      { user: 'Usuario1', content: 'Este es un comentario', timestamp: '2025-02-24T12:30:00Z' }
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ul')).toBeTruthy();
    expect(compiled.querySelector('ul').textContent).toContain('Este es un comentario');
  });

  it('debe mostrar "No hay comentarios aún" cuando no hay comentarios', fakeAsync(() => {
    postServiceMock.getComments.and.returnValue(of({ results: [], count: 0 })); // Simula respuesta vacía

    component.loadComments(1); // Cargar comentarios
    tick(); // Esperar ejecución asíncrona

    fixture.detectChanges(); // Refrescar la vista

    const noCommentsMessage = fixture.nativeElement.querySelector('.no-comments'); // Cambia esto al selector real en tu HTML
    expect(noCommentsMessage).not.toBeNull(); // Asegura que el mensaje se renderiza
    expect(noCommentsMessage.textContent.trim()).toBe('No hay comentarios aún.');
  }));

  it('debe agregar un comentario y mostrarlo en la lista', fakeAsync(() => {
    postServiceMock.addComment.and.callFake(() => of({
      id: 1, user: 'Usuario1', content: 'Nuevo comentario', timestamp: '2025-02-27T12:00:00Z'
    }));

    component.newComment = 'Nuevo comentario';
    component.addComment();
    tick();
    fixture.detectChanges();

    const commentsList = fixture.nativeElement.querySelectorAll('ul li');
    expect(commentsList.length).toBe(1);
    expect(commentsList[0].textContent).toContain('Nuevo comentario');
  }));

  it('debe mostrar el conteo de likes correctamente', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const likesElement: HTMLElement | null = fixture.nativeElement.querySelector('.likes-count');

      console.log('Elemento encontrado:', likesElement?.textContent); // 🔍 Depuración

      expect(likesElement).not.toBeNull();
      expect(likesElement?.textContent).toContain('👍 Likes: 10');
    });
  }));
















});
