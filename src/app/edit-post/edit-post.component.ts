import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../services/post.service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-post',
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.css'],
  imports: [FormsModule, ReactiveFormsModule, CommonModule]
})
export class EditPostComponent implements OnInit {
  post: any = {};
  originalPost: any;
  errorMessage = '';
  permissionError: string| null = ''

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.postService.getPostById(Number(postId)).subscribe({
        next: (data) => {
          this.post = { ...data }; // Copia superficial
          this.originalPost = JSON.parse(JSON.stringify(data)); // Copia profunda
          console.log('Post cargado:', this.post);
          console.log('Copia original:', this.originalPost);
        },
        error: (err) => {
          console.error('Error al cargar el post:', err);
          this.errorMessage = 'No se pudo cargar el post. Inténtalo de nuevo más tarde.';
        }
      });
    }
  }




  updatePost(): void {
    if (!this.post || !this.originalPost) return;

    // Comparar solo los campos relevantes para la actualización
    const hasChanges =
      this.post.title !== this.originalPost.title ||
      this.post.content !== this.originalPost.content ||
      this.post.public_permission !== this.originalPost.public_permission ||
      this.post.authenticated_permission !== this.originalPost.authenticated_permission ||
      this.post.team_permission !== this.originalPost.team_permission;

    console.log('¿Se detectaron cambios?', hasChanges);

    if (!hasChanges) {
      console.log('🔹 No se detectaron cambios, no se actualizará el post.');
      Swal.fire({
        icon: 'info',
        title: 'ℹ️ Sin cambios',
        text: 'No se han realizado modificaciones en el post.',
        confirmButtonText: 'OK'
      });
      return;
    }

    console.log('🔹 Se detectaron cambios, actualizando post...');
    this.postService.updatePost(this.post.id, {
      title: this.post.title,
      content: this.post.content,
      public_permission: this.post.public_permission,
      authenticated_permission: this.post.authenticated_permission,
      team_permission: this.post.team_permission
    }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '✅ Post actualizado',
          text: 'El post se ha actualizado correctamente.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate([`posts/${this.post.id}`]);
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: '❌ Error',
          text: 'Hubo un problema al actualizar el post.',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    });
  }




  cancelEdit(): void {
    Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Los cambios no guardados se perderán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/home']);
      }
    });
  }
  validatePermissions() {
    this.permissionError = null;

    // 🚨 Regla 1: Si el permiso del equipo es "NONE", los demás deben ser "NONE"
    if (this.post.team_permission === 'NONE') {
      if (this.post.authenticated_permission !== 'NONE' || this.post.public_permission !== 'NONE') {
        this.permissionError = "Si el permiso del equipo es 'Ninguno', los demás también deben ser 'Ninguno'.";
        return false;
      }
    }

    // 🚨 Regla 2: Si el permiso autenticado es "NONE", el permiso público también debe ser "NONE"
    if (this.post.authenticated_permission === 'NONE' && this.post.public_permission !== 'NONE') {
      this.permissionError = "Si el permiso autenticado es 'Ninguno', el permiso público también debe ser 'Ninguno'.";
      return false;
    }

    // 🚨 Regla 3: Si el permiso del equipo es "READ_EDIT", autenticado puede ser "READ_EDIT", "READ" o "NONE"
    if (this.post.team_permission === 'READ_EDIT') {
      if (!['READ_EDIT', 'READ', 'NONE'].includes(this.post.authenticated_permission)) {
        this.permissionError = "Si el permiso del equipo es 'Leer y Editar', el permiso autenticado debe ser 'Leer y Editar', 'Leer' o 'Ninguno'.";
        return false;
      }
    }

    // 🚨 Regla 4: Si el permiso del equipo es "READ", autenticado puede ser "READ" o "NONE"
    if (this.post.team_permission === 'READ') {
      if (!['READ', 'NONE'].includes(this.post.authenticated_permission)) {
        this.permissionError = "Si el permiso del equipo es 'Leer', el permiso autenticado debe ser 'Leer' o 'Ninguno'.";
        return false;
      }
    }

    // 🚨 Regla 5: Si el permiso autenticado es "READ_EDIT", público solo puede ser "READ" o "NONE"
    if (this.post.authenticated_permission === 'READ_EDIT' && !['READ', 'NONE'].includes(this.post.public_permission)) {
      this.permissionError = "Si el permiso autenticado es 'Leer y Editar', el permiso público debe ser 'Leer' o 'Ninguno'.";
      return false;
    }

    return true;
  }

}
