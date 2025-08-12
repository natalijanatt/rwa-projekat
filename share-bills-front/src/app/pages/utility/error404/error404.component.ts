import { Component } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `
    <app-error-page
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
      primaryLabel="Go Home"
      primaryLink="/"
      secondaryLabel="Back"
      secondaryLink="../">
    </app-error-page>
  `
})
export class Error404Component {}
