import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenState } from './core/auth/token.state';
import { AuthService } from './core/auth/auth.service';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { ExpenseReviewListener } from './feature/expenses/expense-new.listener';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, NavBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private reviewListener = inject(ExpenseReviewListener);

  ngOnInit() {
    this.reviewListener.init();
  }
}
