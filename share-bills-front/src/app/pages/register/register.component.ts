import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/auth/auth.service';
import { FormComponent } from '../../shared/components/form/form.component';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';

import { UserCreateDto } from '../../feature/users/data/user-create.dto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormComponent, InputFieldComponent, ImageUploaderComponent, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = false;
  error: string | null = null;

  private selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    passwordHash: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  onInputString(
    control: 'name' | 'email' | 'passwordHash' | 'confirmPassword',
    v: string | number
  ) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onSubmit({ name, email, passwordHash }: UserCreateDto, confirmPassword: string) {
    if (this.loading) return;

    if (passwordHash !== confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.register({ name, email, passwordHash }, this.selectedFile ?? undefined)
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.error =
            err?.friendlyMessage ||
            (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message) ||
            err?.message ||
            'Registration failed';
          this.loading = false;
        }
      });
  }

  onAvatarSelected(file: File) {
    this.selectedFile = file;
  }

  onAvatarError(message: string) {
    console.warn(message);
  }
}
