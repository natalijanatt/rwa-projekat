import { Component, inject, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserCreateDto } from '../../feature/users/data/user-create.dto';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormComponent } from '../../shared/components/form/form.component';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormComponent, InputFieldComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  constructor(
    private authService: AuthService
  ) {}

  loading = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    passwordHash: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  onInputString(control: 'name' | 'email' | 'passwordHash' | 'confirmPassword', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onSubmit({name, email, passwordHash}: UserCreateDto, confirmPassword: string) {
    if (this.loading) return;
    if (passwordHash !== confirmPassword) {
      console.log(`${passwordHash}, ${confirmPassword}`);
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true;
    this.error = null;
    
    this.authService.register({ name, email, passwordHash }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });

  }
}
