import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

type ShowErrorWhen = 'touched' | 'dirty' | 'submit' | 'always';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [FormsModule, NgClass, NgIf],
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
})
export class InputFieldComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'number' | 'email' | 'password' = 'text';
  @Input() value: string | number = '';
  @Input() disabled = false;
  @Input() icon?: string;

  @Input() required = false;
  @Input() errorMessage?: string;

  @Input() showErrorWhen: ShowErrorWhen = 'touched';
  @Input() submitted = false;

  @Output() valueChange = new EventEmitter<string | number>();

  touched = false;
  dirty = false;

  onInput(event: Event) {
    this.dirty = true;
    const el = event.target as HTMLInputElement;
    const raw = el.value;

    // Update local value so validators use the latest input
    if (this.type === 'number') {
      // Allow empty string while typing; otherwise coerce to number
      this.value = raw === '' ? '' : Number(raw);
    } else {
      this.value = raw;
    }

    // Emit the same value outward (supports [(value)])
    this.valueChange.emit(this.value);
  }

  onBlur() {
    this.touched = true;
  }

  /** Basic "required" invalid check */
  get invalid(): boolean {
    if (this.disabled || !this.required) return false;

    if (this.type === 'number') {
      // Empty or NaN is invalid; 0 is valid
      if (this.value === '') return true;
      const num = typeof this.value === 'number' ? this.value : Number(this.value);
      return Number.isNaN(num);
    }

    // Text-like inputs: trim whitespace
    const s = (this.value ?? '').toString().trim();
    return s.length === 0;
  }

  get shouldShowError(): boolean {
    if (!this.invalid) return false;
    switch (this.showErrorWhen) {
      case 'always':  return true;
      case 'dirty':   return this.dirty || this.submitted;
      case 'submit':  return this.submitted;
      case 'touched':
      default:        return this.touched || this.submitted;
    }
  }

  get activeErrorMessage(): string | null {
    if (!this.shouldShowError) return null;
    return this.errorMessage ?? 'This field is required';
  }
}
