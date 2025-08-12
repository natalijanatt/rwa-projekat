import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf} from '@angular/common';

type Elevation = 0 | 1 | 2 | 3 | 4; // shadow intensity

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  /** Text header (optional if you use projected header) */
  @Input() title?: string;
  @Input() subtitle?: string;

  /** Visual options */
  @Input() elevation: Elevation = 1;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hoverable = true;
  @Input() bordered = false;
  @Input() loading = false;
  @Input() clickable = false; // makes it look/behave like a button

  /** Accessibility */
  @Input() role: 'group' | 'article' | 'button' = 'article';

  /** Interaction */
  @Output() cardClick = new EventEmitter<MouseEvent>();

  onClick(e: MouseEvent) {
    if (this.clickable && !this.loading) this.cardClick.emit(e);
  }
}
