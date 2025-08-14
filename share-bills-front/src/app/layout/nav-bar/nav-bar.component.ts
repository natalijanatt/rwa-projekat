import { NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive} from '@angular/router';
import { TokenState } from '../../core/auth/token.state';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  private authState = inject(TokenState);

  menuOpen = signal(false);
  isAuth = signal<boolean>(this.authState.isAuthenticated);

  links = [
    { path: '/me',  label: 'My Profile',  authOnly: true },
    { path: '/groups',  label: 'My Groups',  authOnly: true },
    { path: '/',          label: 'Home',      authOnly: false },
  ];

  // isAuth():boolean{
  //   return this.authState.isAuthenticated;
  // }
  toggle() { this.menuOpen.update(v => !v); }
  close()  { this.menuOpen.set(false); }

  logout() { this.authState.forceLogout(); }
}
