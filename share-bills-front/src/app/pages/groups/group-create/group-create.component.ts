import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormComponent } from '../../../shared/components/form/form.component';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../../feature/groups/group.service';

@Component({
  selector: 'app-group-create',
  imports: [
    CommonModule,
    FormComponent,
    InputFieldComponent,
    ImageUploaderComponent,
  ],
  templateUrl: './group-create.component.html',
  styleUrl: './group-create.component.scss',
})
export class GroupCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private groupsService = inject(GroupService);

  loading = false;
  error: string | null = null;

  private selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });

  onInputString(control: 'name', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onSubmit({ name }: { name: string }) {
    if (this.loading) return;
    this.loading = true;
    this.error = null;

    this.groupsService
      .createGroup({ name }, this.selectedFile ?? undefined)
      .subscribe({
        next: (group) => {
          this.router.navigate([`/groups/${group.id}`]);
        },
        error: (err) => {
          this.error =
            err?.friendlyMessage ||
            (Array.isArray(err?.error?.message)
              ? err.error.message.join(', ')
              : err?.error?.message) ||
            'An error occurred while creating the group';
          this.loading = false;
        },
      });
  }

  onCoverSelected(file: File) {
    this.selectedFile = file;
  }

  onCoverError(message: string) {
    console.warn(message);
  }
}
