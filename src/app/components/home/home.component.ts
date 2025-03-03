import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Post } from '../../models/post.model';
import { Like } from '../../models/like.model';
import { NgxPaginationModule } from 'ngx-pagination';
import {OverlayModule} from '@angular/cdk/overlay'
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule,
    NgxPaginationModule, OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush // 🔥 Usa estrategia OnPush
})

export class HomeComponent implements OnInit {
  posts: Post[] = [];
  selectedPostLikes: Like[] = [];
  showLikesForPostId: number | null = null;
  userId: number | null = null;
  isAuthenticated = false;
  username: string | null = null;



  totalItems:number = 0;
  currentPage:number = 1;
  pageSize:number = 10; // Debe coincidir con el de Django
  currentUser: { id: number, team: string, username: string } | null = null; // Definir currentUser correctamente



  currentLikesPage: number = 1;
  totalLikesPages: number = 0;
  totalPages: number = 1;
  selectedPostLikesPage: number = 1;
  likes_per_page: number = 2;


  @ViewChild('likesList', { static: false }) likesList!: ElementRef;
  @ViewChild('likesButton', { static: false }) likesButton!: ElementRef;



  private router = inject(Router);
  public cd = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);


  constructor(
    private postService: PostService,
    private authService: AuthService,
    private eRef: ElementRef,

  ) {}

  ngOnInit(): void {
    // console.log('🔍 PostService:', this.postService); // Verifica si está definido

    this.loadPosts(); // 🔥 Cargar posts inmediatamente al iniciar la vista

    this.authService.isAuthenticated$.subscribe(status => {
      this.isAuthenticated = status;
      if (this.isAuthenticated) {
        this.userId = this.authService.getUserId();
        this.loadPosts();
        // console.log('🔍 PostService:', this.postService);
      }
    });

    this.authService.user$.subscribe(user => {
      this.username = user;
      this.currentUser = user;
    });

    // 🔥 Detectar cambios en la navegación y recargar posts
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadPosts();
        this.cd.detectChanges();
      }
    });

    this.route.params.subscribe(() => {
      this.loadPosts();
      this.cd.detectChanges();
    });
  }

  loadPosts(): void {
    // console.log("🔄 Cargando posts...");
    // console.log('PostService en loadPosts:', this.postService); // 🔍 Debug
    // if (!this.postService) {
    //   console.error('🚨 postService es undefined');
    //   return;
    // }

    // Asegúrate de pasar 'this.pageSize' también al llamar el servicio
    this.postService.getPosts(this.currentPage, this.pageSize).subscribe({
      next: (response: { results: Post[], count: number, page_size?: number }) => {
        // console.log("✅ Datos recibidos de la API:", response);

        if (Array.isArray(response.results)) {
          this.posts = response.results;
          this.totalItems = response.count;
          this.pageSize = response.page_size ?? 10; // Usa page_size de la respuesta si existe
          this.loadCommentCounts(); // 🔥 Cargar el número de comentarios
          this.cd.detectChanges();
        } else {
          console.error("❌ La API no devuelve un array de posts:", response);
        }
      },
      error: (err) => {
        console.error("❌ Error al obtener posts:", err);
      }
    });
}

loadCommentCounts() {
  this.posts.forEach(post => {
    this.postService.getCommentCount(post.id).subscribe(count => {
      post.comment_count = count;  // Se asigna correctamente a cada post
    }, error => {
      console.error(`Error obteniendo comentarios para post ${post.id}:`, error);
      post.comment_count = 0; // En caso de error, asignar 0 comentarios
    });
  });
}



  pageChanged(event: number): void {
    this.currentPage = event;
    this.loadPosts();
  }


  toggleLikesList(post: Post): void {
    this.showLikesForPostId = this.showLikesForPostId === post.id ? null : post.id;
  }

  toggleLike(post: Post): void {
    if (!this.isAuthenticated) return;
    const action = post.liked_by_user ? this.postService.removeLike(post.id) : this.postService.addLike(post.id);
    action.subscribe(() => {
      post.likes_count += post.liked_by_user ? -1 : 1;
      post.liked_by_user = !post.liked_by_user;
      this.cd.detectChanges(); // 🔥 Asegurar que la UI se actualice
    });
  }

  getLikeButtonText(post: Post): string {
    return post.liked_by_user ? '👎 Quitar Me Gusta' : '👍 Me Gusta';
  }

  getPermissionText(permission: string): string {
    switch (permission) {
      case 'NONE': return '🚫 Sin acceso';
      case 'READ': return '📖 Lectura';
      case 'READ_EDIT': return '📝 Lectura y Edición';
      default: return '';
    }
  }

  showLikes(post: Post): void {
    const limit = this.likes_per_page;  // 🔥 Usar el límite correcto
    const offset = (this.selectedPostLikesPage - 1) * limit;  // 🔥 Calculamos el offset según la página actual

    this.postService.getLikes(post.id, limit, offset).subscribe({
      next: (response: { results: Like[], total_pages: number }) => {
        if (Array.isArray(response.results)) {
          this.selectedPostLikes = response.results;
          this.totalLikesPages = response.total_pages;  // Guardar el total de páginas
          this.showLikesForPostId = post.id;
          this.cd.detectChanges();
        } else {
          console.error("Error: La respuesta de likes no es válida", response);
          this.selectedPostLikes = [];
        }
      },
      error: (err) => {
        console.error("Error al obtener la lista de likes:", err);
        this.selectedPostLikes = [];
      }
    });
  }

  // Detectar clics fuera de la lista y cerrar
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.showLikesForPostId !== null) {
      const clickTarget = event.target as HTMLElement;

      // Verifica si el clic ocurrió dentro de la lista o en el botón
      if (
        this.likesList && this.likesList.nativeElement.contains(clickTarget) ||
        this.likesButton && this.likesButton.nativeElement.contains(clickTarget)
      ) {
        return; // No cerrar si se hizo clic dentro
      }

      this.showLikesForPostId = null; // Cerrar lista si se hizo clic afuera
      this.cd.detectChanges();
    }
  }


  // Método para cambiar de página y actualizar los likes
  previousLikesPage(post: Post) {
    if (this.selectedPostLikesPage > 1) {
      this.selectedPostLikesPage--;
      this.showLikes(post);  // 🔥 Ahora `offset` cambia correctamente
    }
  }

  nextLikesPage(post: Post) {
    if (this.selectedPostLikesPage < this.totalLikesPages) {
      this.selectedPostLikesPage++;
      this.showLikes(post);  // 🔥 Ahora `offset` cambia correctamente
    }
  }


  canEditOrDelete(post: Post): boolean {
    if (!this.isAuthenticated || !this.currentUser) {
      // console.log("❌ No autenticado o usuario nulo.");
      return false;
    }

    const username = this.authService.getUsername();
    const userTeam = this.authService.getUserTeam();

    // console.log("🔍 Evaluando post:", post.title);
    // console.log("Usuario autenticado:", this.isAuthenticated);
    // console.log("Nombre de usuario:", username);
    // console.log("Equipo del usuario:", userTeam);
    // console.log("Autor del post:", post.author);
    // console.log("Permiso del equipo:", post.team_permission);
    // console.log("Permiso autenticado:", post.authenticated_permission);

    // 1️⃣ Si el usuario es el autor del post
    if (username === post.author) {
      // console.log("✅ Usuario es el autor, puede editar.");
      return true;
    }

    // 2️⃣ Si el usuario pertenece al equipo y el equipo tiene permiso de edición
    if (post.team_permission === 'READ_EDIT' && userTeam === post.team) {
      // console.log("✅ Usuario pertenece al equipo con permiso de edición.");
      return true;
    }

    // 3️⃣ Si los usuarios autenticados tienen permiso de edición
    if (post.authenticated_permission === 'READ_EDIT') {
      // console.log("✅ Usuarios autenticados pueden editar.");
      return true;
    }

    // console.log("❌ Usuario no tiene permiso para editar este post.");
    return false;
  }


  deletePost(post: Post): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás recuperar este post.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.postService.deletePost(post.id).subscribe({
          next: () => {
            this.posts = this.posts.filter(p => p.id !== post.id);
            this.cd.detectChanges();
            Swal.fire('Eliminado', 'Tu post ha sido eliminado.', 'success');
          },
          error: (err) => {
            console.error("Error al eliminar post:", err);
            Swal.fire('Error', 'No se pudo eliminar el post.', 'error');
          }
        });
      }
    });
  }
  editPost(post: Post): void {
    this.router.navigate(['/edit-post', post.id]);
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/posts', postId]);
  }
}
