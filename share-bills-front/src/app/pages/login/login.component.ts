import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormComponent } from '../../shared/components/form/form.component';
import { InputFieldComponent } from '../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoginDto } from '../../core/auth/data/login.dto';
import { take } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../core/auth/state/auth.actions';
import { selectIsAuth } from '../../core/auth/state/auth.selectors';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormComponent, InputFieldComponent, ButtonComponent],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private actions$ = inject(Actions);

  constructor(private store: Store) {}

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
    this.loading = true;
    this.error = null;

    this.store.dispatch(AuthActions.login(dto));

    // Handle success/failure via actions stream
    this.actions$
      .pipe(ofType(AuthActions.loginSuccess), take(1))
      .subscribe(() => {
        this.loading = false;
        const redirect =
          this.route.snapshot.queryParamMap.get('redirect') || '/';
        this.router.navigateByUrl(redirect);
      });

    this.actions$
      .pipe(ofType(AuthActions.loginFailure), take(1))
      .subscribe(({ error }) => {
        this.loading = false;
        this.error = error ?? 'Login failed';
      });
  }
}
