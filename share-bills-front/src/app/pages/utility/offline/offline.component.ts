import { Component, OnDestroy, OnInit } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `
    <app-error-page
      code="Offline"
      title="{{ online ? 'You are online again' : 'You are offline' }}"
      [message]="online
        ? 'Great! You can keep browsing.'
        : 'No internet connection. Check your network and try again.'"
      [primaryLabel]="online ? 'Continue' : 'Retry'"
      [primaryLink]="online ? '/' : null"
      [showRetry]="!online"
      secondaryLabel="Go Home"
      secondaryLink="/">
    </app-error-page>
  `
})
export class OfflineComponent implements OnInit, OnDestroy {
  online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private onOnline = () => this.online = true;
  private onOffline = () => this.online = false;

  ngOnInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }
  ngOnDestroy() {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
