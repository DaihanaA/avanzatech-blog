export interface Comment {
  id: number;
  blog_post: number;  // ID del post al que pertenece el comentario
  user: string;  // Nombre del usuario que hizo el comentario
  content: string;
  timestamp: string;  // Formato 'YYYY-MM-DD HH:mm:ss'
  post_title: string;  // Título del post al que pertenece el comentario
}
