export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;  // Nombre del usuario en lugar de su ID
  timestamp: string;  // Formato 'YYYY-MM-DD HH:mm:ss'
  comment_count: number;
  excerpt: string;  // Primeros 200 caracteres del contenido
  team: string;  // Nombre del grupo del autor
  likes_count: number;
  liked_by_user: boolean;
  public_permission: 'NONE' | 'READ';
  authenticated_permission: 'NONE' | 'READ' | 'READ_EDIT';
  team_permission: 'NONE' | 'READ' | 'READ_EDIT';
  author_permission: 'READ_EDIT';
  comments: Comment[];  // Lista de comentarios
  newComment?: string;
  showCommentBox?: boolean;
}

export interface PaginatedResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}
