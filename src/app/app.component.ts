import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',

})
export class AppComponent implements OnInit {
  title = 'avanzatech-blog';
  isLoggedIn$: Observable<boolean>;
  user$: Observable<any>;
  username: string | null = null;
  logoutMessage = '';

  constructor(private router: Router, private authService:AuthService){
    this.isLoggedIn$ = this.authService.isAuthenticated$;
    this.user$ = this.authService.user$;


  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(); // ✅ Llama a `getCurrentUser()` para forzar la actualización

    this.user$.subscribe({
      next: (user) => {
        // console.log("Usuario actualizado:", user);
        this.username = user ? user : null //🔄 Se actualiza en tiempo real
      },
      error: (err) => {
        console.error("Error al obtener usuario:", err);
        this.username = "Invitado";
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  logout() {
    const confirmation = window.confirm('¿Estás seguro de que quieres cerrar sesión?'); // Mostrar prompt de confirmación

    if (confirmation) {
      this.authService.logout();  // Si el usuario confirma, proceder con el logout
      Swal.fire({
        icon: 'success',
        title: 'Sesión cerrada',
        text: '✅ Sesión cerrada exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      setTimeout(() => {
        this.router.navigate(['/home']); // Redirigir a la página de inicio
      }, 100);
    } else {
      // Si el usuario cancela, no hacer nada o mostrar algún mensaje si es necesario
      console.log('Logout cancelado');
    }
  }


}
