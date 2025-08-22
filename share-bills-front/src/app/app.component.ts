import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenState } from './core/auth/token.state';
import { AuthService } from './core/auth/auth.service';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { ExpenseReviewListener } from './feature/expenses/expense-new.listener';
import { Store } from '@ngrx/store';
import { selectAuth } from './core/auth/state/auth.selectors';
import { distinctUntilChanged, filter, map, take } from 'rxjs';

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
  private store = inject(Store);

  ngOnInit() {
  this.store.select(selectAuth).pipe(
    map(a => a?.status === 'authenticated'),
    distinctUntilChanged(),
    filter(Boolean),
    take(1)                // <<— call init exactly once
  ).subscribe(() => this.reviewListener.init());
}
}
