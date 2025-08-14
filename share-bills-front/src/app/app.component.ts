import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenState } from './core/auth/token.state';
import { AuthService } from './core/auth/auth.service';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, NavBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
