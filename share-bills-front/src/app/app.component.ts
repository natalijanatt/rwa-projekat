import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { Store } from '@ngrx/store';
import { selectAuth } from './core/auth/state/auth.selectors';
import { distinctUntilChanged, filter, map, take } from 'rxjs';
import { Subscription } from 'rxjs';
import { RealtimeListener } from './feature/realtime/realtime-listener.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, NavBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private reviewListener = inject(RealtimeListener);
  private store = inject(Store);
  private router = inject(Router);
  private routerSubscription: Subscription | undefined;

  ngOnInit() {
    this.store.select(selectAuth).pipe(
      map(a => a?.status === 'authenticated'),
      distinctUntilChanged(),
      filter(Boolean),
      take(1)
    ).subscribe(() => this.reviewListener.init());

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.scrollToTop();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }
}
