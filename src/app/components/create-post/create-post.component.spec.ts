import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreatePostComponent } from './create-post.component';
import { PostService } from '../../services/post.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { QuillModule } from 'ngx-quill';
import { By } from '@angular/platform-browser';

describe('CreatePostComponent', () => {
  let component: CreatePostComponent;
  let fixture: ComponentFixture<CreatePostComponent>;
  let postServiceMock: jasmine.SpyObj<PostService>;
  let routerMock: jasmine.SpyObj<Router>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    postServiceMock = jasmine.createSpyObj('PostService', ['createPost']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['login', 'getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CreatePostComponent, QuillModule],
      declarations: [],
      providers: [
        { provide: PostService, useValue: postServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('debe inicializar el formulario correctamente', () => {
    expect(component.postForm).toBeDefined();
    expect(component.postForm.controls['title']).toBeDefined();
    expect(component.postForm.controls['content']).toBeDefined();
    expect(component.postForm.controls['categorias']).toBeDefined();
  });

  it('debe marcar el formulario como inválido si los campos están vacíos', () => {
    expect(component.postForm.invalid).toBeTrue();
  });

  it('debe mostrar una alerta si el formulario está incompleto', () => {
    spyOn(Swal, 'fire');
    component.crearPost();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'warning',
      title: 'Campos Incompletos',
      text: 'Por favor, completa todos los campos antes de continuar.',
      confirmButtonText: 'Entendido'
    }));
  });

  it('debe enviar los datos correctamente al PostService', () => {
    postServiceMock.createPost.and.returnValue(of({ success: true }));
    component.postForm.setValue({
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ_EDIT',
        author_permission: 'Leer y Editar'
      }
    });
    component.crearPost();
    expect(postServiceMock.createPost).toHaveBeenCalledWith(
      'Título de prueba',
      'Contenido de prueba',
      1,
      'READ', 'READ', 'Leer y Editar', 'READ_EDIT'
    );
  });

  it('debe redirigir al usuario a /home después de crear un post exitosamente', fakeAsync(() => {
    postServiceMock.createPost.and.returnValue(of({ success: true }));
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
      isConfirmed: true
    } as SweetAlertResult<any>));

    component.postForm.setValue({
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ_EDIT',
        author_permission: 'Leer y Editar'
      }
    });

    component.crearPost();
    tick();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('debe manejar errores cuando la API devuelve un fallo', () => {
    postServiceMock.createPost.and.returnValue(throwError(() => new Error('Error en el servidor')));
    spyOn(Swal, 'fire');
    component.postForm.setValue({
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ_EDIT',
        author_permission: 'Leer y Editar'
      }
    });
    component.crearPost();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Error',
      text: 'Hubo un problema al crear el post. Inténtalo de nuevo.',
      confirmButtonText: 'OK'
    }));
  });

  it('debe navegar a /home al cancelar', () => {
    component.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('debe inicializar el formulario con valores por defecto', () => {
    expect(component.postForm.value).toEqual({
      title: '',
      content: '',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ_EDIT',
        author_permission: 'Leer y Editar'
      }
    });
  });

  it('debe marcar inválidos los campos requeridos si están vacíos', () => {
    expect(component.postForm.controls['title'].valid).toBeFalse();
    expect(component.postForm.controls['content'].valid).toBeFalse();
  });

  it('debe marcar el formulario como válido si todos los campos están completos', () => {
    component.postForm.setValue({
      title: 'Título válido',
      content: 'Contenido válido',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ',
        author_permission: 'Leer y Editar'
      }
    });
    expect(component.postForm.valid).toBeTrue();
  });

  it('debe resetear el formulario después de una creación exitosa', fakeAsync(() => {
    postServiceMock.createPost.and.returnValue(of({ success: true }));
    component.postForm.setValue({
      title: 'Título de prueba',
      content: 'Contenido de prueba',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ_EDIT',
        team_permission: 'READ_EDIT',
        author_permission: 'Leer y Editar'
      }
    });
    component.crearPost();
    tick();
    expect(component.postForm.value).toEqual({
      title: '',
      content: '',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ_EDIT',
        author_permission: ''
      }
    });
  }));

  it('🔴 debe deshabilitar el botón si el formulario es inválido', () => {
    const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(button.disabled).toBeTrue();
  });

  it('⚠️ debe mostrar mensaje de error si el título está vacío y fue tocado', () => {
    const titleControl = component.postForm.get('title');
    titleControl?.markAsTouched();  // Simula que el usuario tocó el input
    fixture.detectChanges();

    const errorMessage = fixture.debugElement.query(By.css('.error-message'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain('El título es obligatorio');
  });

  it('📝 debe inicializar correctamente el editor Quill', () => {
    const quillEditor = fixture.debugElement.query(By.css('quill-editor'));
    expect(quillEditor).toBeTruthy();
  });

  it('✅ debe habilitar el botón cuando el formulario es válido', () => {
    component.postForm.patchValue({
      title: 'Mi primer post',
      content: '<p>Contenido del post</p>',
      categorias: {
        public_permission: 'READ',
        authenticated_permission: 'READ',
        team_permission: 'READ',
        author_permission: 'Autor',
      }
    });

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(button.disabled).toBeFalse();
  });
});

