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
    baseCurrencyCode: ['EUR', [Validators.required]],
  });

  currencyOptions = [
    { code: 'RSD', name: 'Serbian Dinar (RSD)' },
    { code: 'EUR', name: 'Euro (EUR)' },
    { code: 'USD', name: 'US Dollar (USD)' },
    { code: 'GBP', name: 'British Pound (GBP)' },
    { code: 'CHF', name: 'Swiss Franc (CHF)' },
    { code: 'JPY', name: 'Japanese Yen (JPY)' },
    { code: 'CAD', name: 'Canadian Dollar (CAD)' },
    { code: 'AUD', name: 'Australian Dollar (AUD)' },
    { code: 'NOK', name: 'Norwegian Krone (NOK)' },
    { code: 'SEK', name: 'Swedish Krona (SEK)' },
    { code: 'DKK', name: 'Danish Krone (DKK)' },
    { code: 'PLN', name: 'Polish Złoty (PLN)' },
    { code: 'CZK', name: 'Czech Koruna (CZK)' },
    { code: 'HUF', name: 'Hungarian Forint (HUF)' },
    { code: 'BGN', name: 'Bulgarian Lev (BGN)' },
    { code: 'RON', name: 'Romanian Leu (RON)' },
    { code: 'HRK', name: 'Croatian Kuna (HRK)' },
    { code: 'BAM', name: 'Bosnia-Herzegovina Mark (BAM)' },
    { code: 'MKD', name: 'Macedonian Denar (MKD)' },
    { code: 'ALL', name: 'Albanian Lek (ALL)' },
  ];

  onInputString(control: 'name', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onCurrencyChange(currencyCode: string) {
    this.form.controls.baseCurrencyCode.setValue(currencyCode);
    this.form.controls.baseCurrencyCode.markAsDirty();
  }

  onSubmit({ name, baseCurrencyCode }: { name: string, baseCurrencyCode: string }) {
    if (this.loading) return;
    this.loading = true;
    this.error = null;

    this.groupsService
      .createGroup({ name, baseCurrencyCode }, this.selectedFile ?? undefined)
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
  }
}
