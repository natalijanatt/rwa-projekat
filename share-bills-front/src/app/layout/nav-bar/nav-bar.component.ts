import { NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TokenState } from '../../core/auth/token.state';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  private authState = inject(TokenState);
  private router = inject(Router);

  menuOpen = signal(false);
  isAuth = signal<boolean>(this.authState.isAuthenticated);

  links = [
    { path: '/',          label: 'Home',      authOnly: false },
    { path: '/me',  label: 'My Profile',  authOnly: true },
    { path: '/groups',  label: 'My Groups',  authOnly: true },
    { path: 'expenses/my', label: 'My Expenses', authOnly: true },
    { path: '/expenses/missed', label: 'Missed Expenses', authOnly: true },
  ];

  toggle() { this.menuOpen.update(v => !v); }
  close()  { this.menuOpen.set(false); }

  /**
   * Handles navigation clicks - scrolls to top if clicking current route
   */
  onNavClick(path: string, event: Event): void {
    const currentUrl = this.router.url;
    
    // If clicking on the current route, scroll to top instead of navigating
    if (currentUrl === path || (path === '/' && currentUrl === '/')) {
      event.preventDefault();
      this.scrollToTop();
    }
    
    this.close(); // Close mobile menu
  }

  /**
   * Scrolls the page to the top with smooth animation
   */
  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }
}
