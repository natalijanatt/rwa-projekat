import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormComponent } from '../../../shared/components/form/form.component';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { GroupService } from '../../../feature/groups/group.service';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';

type DialogData = { group: GroupBaseDto };

@Component({
  selector: 'app-group-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormComponent, InputFieldComponent, ImageUploaderComponent],
  templateUrl: './group-update.component.html',
  styleUrl: './group-update.component.scss',
})
export class GroupUpdateComponent {
  private fb = inject(FormBuilder);
  private groupsService = inject(GroupService);
  private dialogRef = inject(MatDialogRef<GroupUpdateComponent, 'updated' | 'cancel'>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);

  group = this.data.group;

  loading = false;
  error: string | null = null;
  private selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: [this.group?.name ?? '', [Validators.required, Validators.minLength(3)]],
  });

  onInputString(control: 'name', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onSubmit({ name }: { name: string }) {
    if (this.loading || !this.group) return;
    this.loading = true;
    this.error = null;

    this.groupsService.updateGroup(this.group.id, { name }, this.selectedFile ?? undefined).subscribe({
      next: () => {
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.error =
          err?.friendlyMessage ||
          (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message) ||
          'An error occurred while updating the group';
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

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
