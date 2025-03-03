import { Component, OnInit } from '@angular/core';
import { PostService } from '../../services/post.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CreatePostComponent implements OnInit {
  postForm!: FormGroup;
  permissionError: string | null = null;

  permissionsOptions = [
    { value: 'READ', label: 'Leer' },
    { value: 'READ_EDIT', label: 'Leer y Editar' },
    { value: 'NONE', label: 'Ninguno' }
  ];

  constructor(private postService: PostService, private router: Router, private fb: FormBuilder) {}

  ngOnInit() {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      categorias: this.fb.group({
        public_permission: ['READ', Validators.required],
        authenticated_permission: ['READ', Validators.required],
        team_permission: ['READ_EDIT', Validators.required],
        author_permission: ['Leer y Editar',  Validators.required] // 🔥 Deshabilitado porque es fijo
      })
    });
  }

  crearPost() {
    if (this.postForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, completa todos los campos antes de continuar.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // 🔥 Validar permisos antes de enviar
    if (!this.validatePermissions()) {
      Swal.fire({
        icon: 'error',
        title: 'Permisos inválidos',
        text: this.permissionError ?? 'Error desconocido en los permisos.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const formValues = this.postForm.getRawValue();
    const { title, content, categorias } = formValues;
    const { public_permission, authenticated_permission, team_permission, author_permission } = categorias;

    this.postService.createPost(
      title,
      content,
      1, // Categoría por defecto
      public_permission,
      authenticated_permission,
      author_permission,
      team_permission
    ).subscribe({
      next: (response) => {
        console.log('Post creado:', response);

        this.postForm.reset({
          title: '',
          content: '',
          categorias: {
            public_permission: 'READ',
            authenticated_permission: 'READ',
            team_permission: 'READ_EDIT',
            author_permission: ''
          }
        });

        Swal.fire({
          icon: 'success',
          title: '¡Post Creado!',
          text: 'Tu post ha sido creado exitosamente.'
        }).then(() => {
          this.router.navigate(['/home']);
        });
      },
      error: (error) => {
        console.error('Error al crear el post:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al crear el post. Inténtalo de nuevo.',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  onSubmit() {
    if (!this.validatePermissions()) {
      Swal.fire({
        icon: 'error',
        title: 'Permisos inválidos',
        text: this.permissionError ?? 'Error en la configuración de permisos.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.crearPost(); // Solo se ejecuta si los permisos son válidos
  }




  cancel() {
    this.router.navigate(['/home']);
  }

  validatePermissions() {
    this.permissionError = null;

    const { team_permission, authenticated_permission, public_permission } = this.postForm.value.categorias;

    // 🚨 Regla 1: Si el permiso del equipo es "NONE", los demás deben ser "NONE"
    if (team_permission === 'NONE') {
      if (authenticated_permission !== 'NONE' || public_permission !== 'NONE') {
        this.permissionError = "Si el permiso del equipo es 'Ninguno', los demás también deben ser 'Ninguno'.";
        return false;
      }
    }

    // 🚨 Regla 2: Si el permiso autenticado es "NONE", el permiso público también debe ser "NONE"
    if (authenticated_permission === 'NONE' && public_permission !== 'NONE') {
      this.permissionError = "Si el permiso autenticado es 'Ninguno', el permiso público también debe ser 'Ninguno'.";
      return false;
    }

    // 🚨 Regla 3: Si el permiso del equipo es "READ_EDIT", autenticado puede ser "READ_EDIT", "READ" o "NONE"
    if (team_permission === 'READ_EDIT' && !['READ_EDIT', 'READ', 'NONE'].includes(authenticated_permission)) {
      this.permissionError = "Si el permiso del equipo es 'Leer y Editar', el permiso autenticado debe ser 'Leer y Editar', 'Leer' o 'Ninguno'.";
      return false;
    }

    // 🚨 Regla 4: Si el permiso del equipo es "READ", autenticado puede ser "READ" o "NONE"
    if (team_permission === 'READ' && !['READ', 'NONE'].includes(authenticated_permission)) {
      this.permissionError = "Si el permiso del equipo es 'Leer', el permiso autenticado debe ser 'Leer' o 'Ninguno'.";
      return false;
    }

    // 🚨 Regla 5: Si el permiso autenticado es "READ_EDIT", público solo puede ser "READ" o "NONE"
    if (authenticated_permission === 'READ_EDIT' && !['READ', 'NONE'].includes(public_permission)) {
      this.permissionError = "Si el permiso autenticado es 'Leer y Editar', el permiso público debe ser 'Leer' o 'Ninguno'.";
      return false;
    }

    return true;
  }


}
