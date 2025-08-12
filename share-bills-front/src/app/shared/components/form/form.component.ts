import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, input, Output } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, NgIf, NgFor],
  standalone: true,
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  exportAs: 'appForm'
})
export class FormComponent {
  @Input({required: true}) form!: FormGroup;

  @Input() title = '';
  @Input() submitLabel = 'Submit';
  @Input() cancelLabel = 'Cancel';
  @Input() loading = false;
  @Input() showError = false;
  @Input() autoMarkAllAsTouched = true;

  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  submitted = false;

  onSubmit() {
    this.submitted = true;
    if(this.autoMarkAllAsTouched) {
      this.form.markAllAsTouched();
    }
    if (this.form.invalid) {
      return;
    }
    this.submit.emit(this.form.getRawValue());  
  }
  onCancel(){
    this.cancel.emit();
  }

  get errorList(){
    if (!this.submitted || !this.form?.invalid) return [];
    const out: { path: string; errors: string[] }[] = [];
    const walk = (ctrl: AbstractControl, path: string[] = []) => {
      if ((ctrl as any).controls) {
        const controls = (ctrl as any).controls;
        Object.keys(controls).forEach(k => walk(controls[k], [...path, k]));
      } else if (ctrl.errors) {
        out.push({ path: path.join('.'), errors: Object.keys(ctrl.errors) });
      }
    };
    walk(this.form);
    return out;
  }


}
