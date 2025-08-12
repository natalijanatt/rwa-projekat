import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [NgClass, NgIf],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() disabled: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() icon: string | null = null;
  @Input() loading: boolean = false;

  @Output() clicked = new EventEmitter<MouseEvent>()

  onClick(event: MouseEvent){
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

}

