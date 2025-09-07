import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormComponent } from '../../../shared/components/form/form.component';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { UserService } from '../../../feature/users/user.service';
import { UserDto } from '../../../feature/users/data/user.dto';

type DialogData = { user: UserDto };

@Component({
  selector: 'app-user-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormComponent, InputFieldComponent, ImageUploaderComponent],
  templateUrl: './user-update.component.html',
  styleUrl: './user-update.component.scss',
})
export class UserUpdateComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<UserUpdateComponent, 'updated' | 'cancel'>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);

  user = this.data.user;

  loading = false;
  error: string | null = null;
  private selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: [this.user?.name ?? '', [Validators.required, Validators.minLength(2)]],
    email: [this.user?.email ?? '', [Validators.required, Validators.email]],
  });

  onInputString(control: 'name' | 'email', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onSubmit({ name, email }: { name: string; email: string }) {
    if (this.loading || !this.user) return;
    this.loading = true;
    this.error = null;

    this.userService.updateUser({ name, email }, this.selectedFile ? this.selectedFile: null).subscribe({
      next: () => {
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.error =
          err?.friendlyMessage ||
          (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message) ||
          'An error occurred while updating the user';
        this.loading = false;
      },
    });
  }

  onAvatarSelected(file: File) {
    this.selectedFile = file;
  }

  onAvatarError(message: string) {
    console.warn(message);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}

