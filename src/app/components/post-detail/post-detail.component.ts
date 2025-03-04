import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../services/post.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';  // ✅ Servicio de autenticación
import { RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  host: { ngSkipHydration: 'true' },
})

export class PostDetailComponent implements OnInit {
  post: any;
  isAuthenticated = false;
  showCommentBox = false;
  newComment = '';
  showAuthMessage = false;
  selectedPostLikes: any[] = [];
  showLikesForPostId: number | null = null;
  author: string = '';
  team: string = '';
  timestamp: string = '';
  likesCount: number = 0;
  apiUrl: string = environment.apiUrl;

  // 🔹 Variables para paginación de comentarios
  currentPage = 1;
  limit = 5; // Número de comentarios por página
  totalComments = 0;
  comments: any[] = [];
  nextPageUrl: string | null = null;
  prevPageUrl: string | null = null;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Escuchar cambios en la autenticación
    this.authService.isAuthenticated$.subscribe(authenticated => {
      console.log('Usuario autenticado:', authenticated);  // Imprime el estado de autenticación
      this.isAuthenticated = authenticated;
      this.cdr.detectChanges();
    });

    // Obtener ID del post y cargar sus datos
    this.route.paramMap.pipe(
      switchMap(params => {
        const postId = Number(params.get('id'));
        console.log('ID del post obtenido de los parámetros:', postId);  // Imprime el ID del post
        return this.postService.getPostById(postId);
      })
    ).subscribe(post => {
      console.log('Post cargado:', post);  // Imprime el post obtenido desde el servicio
      this.post = post;
      this.author = post.author || 'Desconocido';
      this.team = post.team || 'Sin equipo';
      this.timestamp = post.timestamp || 'Fecha no disponible';
      this.likesCount = post.likes_count || 0;

      // 🔹 Cargar comentarios del post
      this.loadComments();

      this.cdr.detectChanges();
    });
  }


  addComment(): void {
    if (!this.isAuthenticated) {
      this.showAuthMessage = true;
      return;
    }

    if (!this.newComment?.trim()) return;

    this.postService.addComment(this.post.id, this.newComment).subscribe({
      next: (newComment) => {
        this.comments.push(newComment); // 🔹 Añadir comentario al final de la lista
        this.newComment = ''; // Limpia el campo
        this.showAuthMessage = false; // Oculta el mensaje si ya inició sesión
      },
      error: (err) => {
        console.error("Error al agregar comentario:", err);
      }
    });
  }

  cancelComment(): void {
    this.newComment = ''; // Limpia el cuadro de texto
    this.showAuthMessage = false; // Oculta el mensaje de autenticación si estaba visible
  }

  // 🔹 Cargar comentarios paginados
  loadComments(page: number = 1) {
    if (!this.post?.id) return;

    const limit = 5; // Número de comentarios por página
    const offset = (page - 1) * limit; // Calcular correctamente el desplazamiento

    this.postService.getComments(this.post.id, page, limit).subscribe({
      next: (response) => {
        this.comments = response.results;  // ✅ Solo comentarios de la página actual
        this.totalComments = response.count;
        this.nextPageUrl = response.next;
        this.prevPageUrl = response.previous ? response.previous : null;
        this.currentPage = page;
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
      }
    });
  }


  // 🔹 Funciones para la paginación
  nextPage() {
    if (this.nextPageUrl) {
      this.loadComments(this.currentPage + 1); // ✅ Pasa la página correcta
    }
  }

  prevPage() {
    if (this.prevPageUrl && this.currentPage > 1) {
      this.loadComments(this.currentPage - 1); // ✅ Retrocede correctamente
    }
  }



}
