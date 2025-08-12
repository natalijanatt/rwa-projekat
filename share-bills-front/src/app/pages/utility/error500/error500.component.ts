import { Component } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-error-500',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `
    <app-error-page
      code="500"
      title="Something went wrong"
      message="Our server had a hiccup. Please try again in a moment."
      primaryLabel="Retry"
      [primaryLink]="null"
      [showRetry]="true" secondaryLabel="Go Home" secondaryLink="/">
    </app-error-page>
  `,
})
export class Error500Component {}
