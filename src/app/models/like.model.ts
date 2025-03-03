export interface Like {
  id: number;
  user: string;  // Nombre del usuario en lugar de su ID
  blog_post: string;  // Título del post en lugar de su ID,
  timestamp: string;  // Formato 'YYYY-MM-DD HH:mm:ss'
}
