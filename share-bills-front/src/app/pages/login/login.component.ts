import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormComponent } from '../../shared/components/form/form.component';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/auth/auth.service';
import { AuthState } from '../../core/auth/auth.state';
import { LoginDto } from '../../core/auth/data/login.dto';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormComponent, InputFieldComponent, ButtonComponent],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private state = inject(AuthState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;

  error: string | null = null;
  expired = this.route.snapshot.queryParamMap.get('expired') === 'true';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onInputString(control: 'email' | 'password', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

onSubmit(dto: LoginDto) {
  if (this.loading) return;
  this.error = null;
  this.loading = true;

  this.auth.login(dto).pipe(
    tap(({ access_token: access_token }) => {console.log(access_token); this.state.setToken(access_token)}),
    switchMap(() => this.auth.me()),
    tap(user => this.state.setUser(user)),
    finalize(() => (this.loading = false)),
    catchError(err => {
      // map server error to UI
      this.error = err?.error?.message ?? 'Invalid credentials';
      this.state.clear();
      return of(null);
    })
  ).subscribe(user => {
    if (!user) return; // error already handled
    const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/';
    this.router.navigateByUrl(redirect);
  });
}
}
