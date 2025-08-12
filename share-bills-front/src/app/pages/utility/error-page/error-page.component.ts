import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [NgIf, RouterLink, ButtonComponent],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss'],
})
export class ErrorPageComponent {
  @Input({ required: true }) code!: string;           // e.g. "404"
  @Input({ required: true }) title!: string;          // e.g. "Page not found"
  @Input({ required: true }) message!: string;        // short explainer

  // Primary CTA
  @Input() primaryLabel = 'Go Home';
  @Input() primaryLink: string | null = '/';

  // Secondary CTA
  @Input() secondaryLabel?: string;
  @Input() secondaryLink?: string;

  // Optional: show a Retry button (emits a full reload)
  @Input() showRetry = false;

  retry() {
    // keep it simple
    location.reload();
  }
}
