import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from './shared/components/button/button.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { InputFieldComponent } from './shared/components/input-field/input-field.component';
import { FormsModule } from '@angular/forms';
import { CardComponent } from './shared/components/card/card.component';
import { CardListComponent } from './shared/components/card-list/card-list.component';
import { AuthState } from './core/auth/auth.state';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ButtonComponent,
    InputFieldComponent,
    FormsModule,
    CardComponent,
    CardListComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  state = inject(AuthState);
  auth = inject(AuthService);
  ngOnInit() {
    if (this.state.isAuthenticated) {
      const token = this.state.accessToken()!;
      this.state.scheduleAutoLogout(token);
      this.auth.me().subscribe({
        next: (u) => this.state.setUser(u),
        error: () => this.state.clear(),
      });
    } else {
      this.state.clear();
    }
  }

  title = 'share-bills-front';

  onClick() {
    console.log('Button clicked!');
  }

  submited = signal(false);
  onSubmit() {
    this.submited.set(true);
    console.log('Form submitted!');
  }
}
