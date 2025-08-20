import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GroupFullDto } from '../../../feature/groups/data/group-full.dto';
import { Store } from '@ngrx/store';
import { GroupMemberBaseDto } from '../../../feature/groups/data/group-member-base.dto';
import { FormBuilder } from '@angular/forms';
import { CreateExpenseDto } from '../../../feature/expenses/data/expense-create.dto';
import { ExpenseService } from '../../../feature/expenses/expense.service';
import { FormComponent } from '../form/form.component';
import { InputFieldComponent } from '../input-field/input-field.component';
import { NgFor, NgIf } from '@angular/common';
import { selectUser } from '../../../core/auth/state/auth.selectors';

type DialogData = { group: GroupFullDto };

@Component({
  selector: 'app-expense-create',
  standalone: true,
  imports: [FormComponent, InputFieldComponent, NgFor, NgIf],
  templateUrl: './expense-create.component.html',
  styleUrl: './expense-create.component.scss',
})
export class ExpenseCreateComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(
    MatDialogRef<ExpenseCreateComponent, 'added' | 'cancel'>
  );
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private expenseService = inject(ExpenseService);
  private state = inject(Store);

  group = this.data.group;
  loading = false;
  error: string | null = null;
  // type: 'expense' | 'transfer' = 'expense';
  type = signal<'expense' | 'transfer'>('expense');
  selectedMember: GroupMemberBaseDto | null = null;
  members: GroupMemberBaseDto[] = [];

  form = this.fb.group({
    title: ['', []],
    amount: [0, []],
    txnType: [this.type, []],
  });

  ngOnInit() {
    this.state.select(selectUser).subscribe((user) => {
      if (user) {
        this.members = this.group.members.filter(
          (member) => member.userId !== user.id
        );
      }
    });
  }

  onInputString(control: 'title', v: string | number) {
    const val = typeof v === 'number' ? String(v) : v;
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onInputNumber(control: 'amount', v: string | number) {
    const val = typeof v === 'number' ? v : parseFloat(v);
    this.form.controls[control].setValue(val);
    this.form.controls[control].markAsDirty();
  }

  onToggleMember(member: GroupMemberBaseDto, checked: boolean) {
    this.selectedMember = checked
      ? member
      : this.selectedMember?.id === member.id
      ? null
      : this.selectedMember;
  }
  onSelectType(type: 'expense' | 'transfer') {
    this.type.set(type);
    if (type === 'expense') this.selectedMember = null;
    this.form.controls.txnType.markAsDirty();
  }

  onSubmit() {
    if (this.loading || !this.group) return;
    this.loading = true;
    this.error = null;

    const expenseData: CreateExpenseDto = {
      groupId: this.group.id,
      title: this.form.value.title ?? '',
      amount: this.form.value.amount ?? 0,
      dateIncurred: new Date().toISOString().split('T')[0],
      paidToId: this.selectedMember?.id ?? null,
      txnType: this.type(),
    };

    if (expenseData.txnType === 'transfer' && !expenseData.paidToId) {
      this.error = 'Please select a member to transfer to.';
      this.loading = false;
      return;
    }

    this.expenseService.createExpense(expenseData).subscribe({
      next: () => {
        this.dialogRef.close('added');
      },
      error: (err) => {
        this.error =
          err?.friendlyMessage ||
          (Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message) ||
          'An error occurred while creating the expense';
        this.loading = false;
      },
    });
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  setType(newType: 'expense' | 'transfer') {
    this.type.set(newType);
}
}
