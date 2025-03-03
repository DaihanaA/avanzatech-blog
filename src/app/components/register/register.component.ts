import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  standalone: true
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = ''; // Variable para almacenar el mensaje de error

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required, Validators.minLength(8)]]
    },  { validator: this.passwordsMatch });
  }
  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

  register() {
    if (this.registerForm.valid) {
      const userData = this.registerForm.value;
      this.authService.registerUser(userData).subscribe({
        next: () => {
          this.errorMessage = ''; // Limpiar errores generales
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Detalles del error recibido:', error);

          if (error.status === 400 && error.error) {
            const usernameControl = this.registerForm.controls['username'];

            if (error.error.username && Array.isArray(error.error.username)) {
              // 🔹 Reemplazar mensaje en inglés por español
              const errorMessage = error.error.username[0] === "A user with that username already exists."
                ? "Este correo ya se encuentra registrado."
                : error.error.username[0];

              // 🔹 Establecer el error en el campo del formulario
              usernameControl.setErrors({ usernameTaken: errorMessage });
            }
          } else {
            this.errorMessage = 'Error inesperado. Intenta nuevamente.';
          }
        }
      });
    }
  }




  formatErrorMessages(errorObj: any): string {
    if (typeof errorObj === 'object') {
      return Object.values(errorObj).flat().join('<br>'); // Convierte JSON de error a un string
    }
    return 'Error en el registro. Verifica los datos.';
  }


  goToLogin() {
    this.router.navigate(['/login']);
  }

  onCancel() {
    this.router.navigate(['/home']);
  }
  validateField(field: string) {
    this.registerForm.controls[field].markAsTouched();
  }
}
