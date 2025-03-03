import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class LoginComponent {
  loginForm!: FormGroup;
  errorMessage: string = ''; // Mensaje de error
  passwordFieldType: string = 'password'; // Tipo de campo de contraseña

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public router: Router
  ) {  this.loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.email]], // 📌 Correo requerido y válido
    password: ['', [Validators.required, Validators.minLength(8)]] // 📌 Contraseña requerida y mínimo 8 caracteres
  });
}


login() {
  if (this.loginForm.invalid) {
    return;
  }

  const formData = this.loginForm.value;

  this.authService.login(formData).subscribe({
    next: (response) => {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      // 🔥 Llamamos a getCurrentUser() para actualizar el usuario sin recargar
      this.authService.getCurrentUser().subscribe();

      // Redirigir después de un breve retraso para asegurar la actualización
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 100); // 100ms de retraso
    },
    error: (error) => {
      this.errorMessage = 'Contraseña incorrecta.';
      console.error('Login error:', error);
    }
  });
}


  goToRegister() {
    this.router.navigate(['/register']);
  }

  onCancel() {
    this.router.navigate(['/home']); // Redirige a la página de inicio
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  validateField(field: string) {
    this.loginForm.controls[field].markAsTouched();
  }


}
