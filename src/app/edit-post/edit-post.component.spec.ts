import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditPostComponent } from './edit-post.component';
import { PostService } from '../services/post.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { Post } from '../models/post.model';
import { FormsModule } from '@angular/forms';


describe('EditPostComponent', () => {
  let component: EditPostComponent;
  let fixture: ComponentFixture<EditPostComponent>;
  let postServiceMock: jasmine.SpyObj<PostService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;



  beforeEach(async () => {
    postServiceMock = jasmine.createSpyObj('PostService', ['getPostById', 'updatePost']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    activatedRouteMock = { snapshot: { paramMap: { get: () => '1' } } };

    await TestBed.configureTestingModule({
      imports: [EditPostComponent, FormsModule],
      providers: [
        { provide: PostService, useValue: postServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    const mockPost: Post = {
      id: 1,
      title: 'Título',
      content: 'Contenido',
      author: 'Autor Prueba',
      timestamp: '2025-02-25 10:00:00',
      comment_count: 0,
      excerpt: 'Contenido',
      team: 'Equipo Prueba',
      likes_count: 0,
      liked_by_user: false,
      public_permission: 'NONE',
      authenticated_permission: 'NONE',
      team_permission: 'NONE',
      author_permission: 'READ_EDIT',
      comments: [],
      newComment: '',
      showCommentBox: false
    };

    // Asegurar que getPostById devuelve un observable antes de crear el componente
    postServiceMock.getPostById.and.returnValue(of(mockPost));

    fixture = TestBed.createComponent(EditPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });




  it('debe cargar el post correctamente en ngOnInit', () => {
    expect(postServiceMock.getPostById).toHaveBeenCalledWith(1);
    expect(component.post).toBeTruthy();
    expect(component.post.id).toBe(1);
  });

  it('debe actualizar el post correctamente', fakeAsync(() => {
    const mockPost: Post = {
      id: 1,
      title: 'Nuevo Título',
      content: 'Nuevo Contenido',
      author: 'Autor Ejemplo',
      timestamp: '2025-02-25 12:00:00',
      comment_count: 0,
      excerpt: 'Extracto...',
      team: 'Equipo A',
      likes_count: 0,
      liked_by_user: false,
      public_permission: 'NONE',
      authenticated_permission: 'NONE',
      team_permission: 'NONE',
      author_permission: 'READ_EDIT',
      comments: []
    };

    component.post = mockPost;
    postServiceMock.updatePost.and.returnValue(of({}));

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult<any>));

    component.updatePost();
    tick();

    expect(postServiceMock.updatePost).toHaveBeenCalledWith(1,jasmine.objectContaining( {
      title: 'Nuevo Título',
      content: 'Nuevo Contenido',
      public_permission: 'NONE',
      authenticated_permission: 'NONE',
      team_permission: 'NONE'
    }));

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success' }));
    expect(routerMock.navigate).toHaveBeenCalledWith(['posts/1']);
  }));

  it('debe mostrar un mensaje de error si la actualización falla', fakeAsync(() => {
    component.post = { id: 1, title: 'Título', content: 'Contenido' } as Post;
    postServiceMock.updatePost.and.returnValue(throwError(() => new Error('Error al actualizar')));

    spyOn(Swal, 'fire');

    component.updatePost();
    tick();

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error' }));
  }));

  it('debe redirigir a /home si se confirma la cancelación', fakeAsync(() => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as SweetAlertResult<any>));

    component.cancelEdit();
    tick();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('no debe redirigir si el usuario elige seguir editando', fakeAsync(() => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as SweetAlertResult<any>));

    component.cancelEdit();
    tick();

    expect(routerMock.navigate).not.toHaveBeenCalled();
  }));

  it('debe inicializar el formulario con los valores del post', () => {
    const mockPost: Post = {
      id: 1,
      title: 'Título de Prueba',
      content: 'Contenido de Prueba',
      author: 'Autor',
      timestamp: '2025-02-25 10:00:00',
      comment_count: 0,
      excerpt: 'Extracto',
      team: 'Equipo A',
      likes_count: 0,
      liked_by_user: false,
      public_permission: 'NONE',
      authenticated_permission: 'READ',
      team_permission: 'READ_EDIT',
      author_permission: 'READ_EDIT',
      comments: [],
    };

    postServiceMock.getPostById.and.returnValue(of(mockPost));
    component.ngOnInit();

    expect(component.post).toEqual(mockPost);
  });

  it('debe deshabilitar el botón de actualizar si el título o contenido están vacíos', () => {
    component.post = {
      id: 1,
      title: '',
      content: '',
      public_permission: 'NONE',
      authenticated_permission: 'NONE',
      team_permission: 'NONE',
      author: '',
      timestamp: '',
      comment_count: 0,
      excerpt: '',
      team: '',
      likes_count: 0,
      liked_by_user: false,
      author_permission: 'READ_EDIT',
      comments: [],
    };

    fixture.detectChanges();

    const updateButton = fixture.nativeElement.querySelector('.btn-primary');
    expect(updateButton.disabled).toBeTrue();
  });

  it('no debe llamar updatePost si los valores del post no han cambiado', () => {
    const mockPost: Post = {
      id: 1,
      title: 'Título Original',
      content: 'Contenido Original',
      public_permission: 'NONE',
      authenticated_permission: 'READ',
      team_permission: 'READ_EDIT',
      author: 'Autor Ejemplo',
      timestamp: '2025-02-25 12:00:00',
      comment_count: 0,
      excerpt: '',
      team: 'Equipo A',
      likes_count: 0,
      liked_by_user: false,
      author_permission: 'READ_EDIT',
      comments: []
    };

    postServiceMock.getPostById.and.returnValue(of(mockPost));
    component.ngOnInit();

    spyOn(component, 'updatePost');


    expect(component.updatePost).not.toHaveBeenCalled();
  });

  it('debe llamar updatePost si los valores del post han cambiado', () => {
    const mockPost: Post = {
      id: 1,
      title: 'Título Original',
      content: 'Contenido Original',
      public_permission: 'NONE',
      authenticated_permission: 'READ',
      team_permission: 'READ_EDIT',
      author: 'Autor Ejemplo',
      timestamp: '2025-02-25 12:00:00',
      comment_count: 0,
      excerpt: '',
      team: 'Equipo A',
      likes_count: 0,
      liked_by_user: false,
      author_permission: 'READ_EDIT',
      comments: []
    };

    postServiceMock.getPostById.and.returnValue(of(mockPost));
    component.ngOnInit();

    spyOn(component, 'updatePost');

    // Simulamos un cambio en el título
    component.post.title = 'Nuevo Título';
    component.updatePost();

    expect(component.updatePost).toHaveBeenCalled();
  });

  it('debe manejar errores al obtener el post', () => {
    postServiceMock.getPostById.and.returnValue(throwError(() => new Error('Error al cargar el post')));

    component.ngOnInit();

    expect(component.errorMessage).toBe('No se pudo cargar el post. Inténtalo de nuevo más tarde.');
  });


  it('debe mostrar advertencia si el usuario intenta salir con cambios sin guardar', fakeAsync(() => {
    component.post = {
      id: 1,
      title: 'Título Original',
      content: 'Contenido Original',
      public_permission: 'NONE',
      authenticated_permission: 'READ',
      team_permission: 'READ_EDIT',
      author: 'Autor Ejemplo',
      timestamp: '2025-02-25 12:00:00',
      comment_count: 0,
      excerpt: '',
      team: 'Equipo A',
      likes_count: 0,
      liked_by_user: false,
      author_permission: 'READ_EDIT',
      comments: []
    };

    fixture.detectChanges();

    // Simular cambio en el formulario
    component.post.title = 'Nuevo Título';
    fixture.detectChanges();

    spyOn(Swal, 'fire').and.returnValue(
      Promise.resolve({ isConfirmed: false } as SweetAlertResult<any>)
    );

    component.cancelEdit();
    tick();

    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'warning' }));
    expect(routerMock.navigate).not.toHaveBeenCalled();
  }));

  it('debe mostrar el título en el campo de entrada', async () => {
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#title');
    expect(input).toBeTruthy();
    expect(input.value).toBe('Título');
  });

  it('debe mostrar el contenido en el área de texto', async () => {
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('#content');
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('Contenido');
  });

  it('debe mostrar el permiso público seleccionado correctamente', async () => {
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#publicPermission');
    expect(select).toBeTruthy();
    expect(select.value).toBe('NONE'); // Verifica el valor seleccionado
  });

  it('debe mostrar el permiso autenticado seleccionado correctamente', async () => {
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#authenticatedPermission');
    expect(select).toBeTruthy();
    expect(select.value).toBe('NONE'); // Verifica el valor seleccionado
  });

  it('debe mostrar el permiso del equipo seleccionado correctamente', async () => {
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#teamPermission');
    expect(select).toBeTruthy();
    expect(select.value).toBe('NONE'); // Verifica el valor seleccionado
  });

  it('debe deshabilitar el botón de actualización si el título o el contenido están vacíos', async () => {
    component.post.title = '';
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.btn-primary');
    expect(button.disabled).toBeTrue();
  });

  it('debe habilitar el botón de actualización si hay título y contenido', async () => {
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.btn-primary');
    expect(button.disabled).toBeFalse();
  });

  it('debe llamar a `updatePost` al enviar el formulario', async () => {
    spyOn(component, 'updatePost');

    await fixture.whenStable();
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(component.updatePost).toHaveBeenCalled();
  });

  it('debe llamar a `cancelEdit` al hacer clic en el botón de cancelar', async () => {
    spyOn(component, 'cancelEdit');

    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.btn-secondary');
    button.click();

    expect(component.cancelEdit).toHaveBeenCalled();
  });
  it('debe mostrar un error si los permisos son inválidos', () => {
    component.post.team_permission = 'NONE';
    component.post.authenticated_permission = 'READ';
    component.validatePermissions();
    expect(component.permissionError).toBeTruthy();
  });

  it('debe permitir actualizar si no hay error', () => {
    component.post = {
      title: 'Prueba',
      content: 'Contenido de prueba',
      team_permission: 'READ',
      authenticated_permission: 'NONE',
      public_permission: 'NONE'
    };
    component.validatePermissions();
    expect(component.permissionError).toBeNull();
  });

  // ✅ Caso 1: Permisos válidos (team = READ_EDIT, authenticated = READ, public = READ)
  it('debería validar correctamente permisos válidos', () => {
    component.post = {
      team_permission: 'READ_EDIT',
      authenticated_permission: 'READ',
      public_permission: 'READ'
    };

    expect(component.validatePermissions()).toBeTrue();
    expect(component.permissionError).toBeNull();
  });

  // ❌ Caso 2: team_permission = NONE pero authenticated_permission != NONE
  it('debería fallar cuando team_permission es NONE y authenticated_permission no lo es', () => {
    component.post = {
      team_permission: 'NONE',
      authenticated_permission: 'READ',
      public_permission: 'NONE'
    };

    expect(component.validatePermissions()).toBeFalse();
    expect(component.permissionError).toContain("Si el permiso del equipo es 'Ninguno'");
  });

  // ❌ Caso 3: authenticated_permission = NONE pero public_permission != NONE
  it('debería fallar cuando authenticated_permission es NONE y public_permission no lo es', () => {
    component.post = {
      team_permission: 'READ',
      authenticated_permission: 'NONE',
      public_permission: 'READ'
    };

    expect(component.validatePermissions()).toBeFalse();
    expect(component.permissionError).toContain("Si el permiso autenticado es 'Ninguno'");
  });

  // ❌ Caso 4: team_permission = READ_EDIT, pero authenticated_permission tiene un valor inválido
  it('debería fallar cuando team_permission es READ_EDIT y authenticated_permission no está en [READ_EDIT, READ, NONE]', () => {
    component.post = {
      team_permission: 'READ_EDIT',
      authenticated_permission: 'INVALIDO',  // ❌ Caso inválido
      public_permission: 'READ'
    };

    expect(component.validatePermissions()).toBeFalse();
    expect(component.permissionError).toContain("Si el permiso del equipo es 'Leer y Editar'");
  });

  // ❌ Caso 5: authenticated_permission = READ_EDIT, pero public_permission tiene un valor inválido
  it('debería fallar cuando authenticated_permission es READ_EDIT y public_permission no está en [READ, NONE]', () => {
    component.post = {
      team_permission: 'READ_EDIT',
      authenticated_permission: 'READ_EDIT',
      public_permission: 'READ_EDIT'  // ❌ Caso inválido
    };

    expect(component.validatePermissions()).toBeFalse();
    expect(component.permissionError).toContain("Si el permiso autenticado es 'Leer y Editar'");
  });


});
