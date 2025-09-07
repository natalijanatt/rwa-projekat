import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { UserBaseDto } from '../../../feature/users/data/user-base.dto';
import { GroupService } from '../../../feature/groups/group.service';
import { UserService } from '../../../feature/users/user.service'; // <-- should expose a search API
import { ButtonComponent } from '../../../shared/components/button/button.component';

type DialogData = { group: GroupBaseDto };

@Component({
  selector: 'app-group-add-member',
  standalone: true,
  imports: [
    // Angular
    CommonModule, NgIf, NgFor, AsyncPipe, ReactiveFormsModule,
    // Material
    MatFormFieldModule, MatInputModule, MatListModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './group-add-member.component.html',
  styleUrl: './group-add-member.component.scss'
})
export class GroupAddMemberComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GroupAddMemberComponent, 'added' | 'cancel'>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private groupsService = inject(GroupService);
  private usersService = inject(UserService);

  group = this.data.group;

  loading = false;
  error: string | null = null;

  searchCtrl = new FormControl<string>('', { nonNullable: true });
  results$!: Observable<UserBaseDto[]>;

  selectedMember: UserBaseDto | null = null;

  ngOnInit(): void {
  this.results$ = this.searchCtrl.valueChanges.pipe(
    map(v => (v ?? '').trim()),
    debounceTime(350),
    distinctUntilChanged(),
    switchMap(term => {
      this.error = null;

      if (term.length < 2) {
        
        this.loading = false;
        this.selectedMember = null;
        return of<UserBaseDto[]>([]);
      }

      this.loading = true;
      return this.usersService.searchUsers({ query: term }).pipe(
        map((res: any) => res as UserBaseDto[]),
        catchError(err => {
          this.error =
            err?.friendlyMessage ||
            (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message) ||
            'Failed to search users';
          return of<UserBaseDto[]>([]);
        }),
        finalize(() => (this.loading = false))
      );
    })
  );
}

  displayUser(u: UserBaseDto): string {
    return u?.name?? `${u.name ?? ''} ${u.email ?? ''}`.trim();
  }

  onMemberSelected(member: UserBaseDto) {
    this.selectedMember = member;
    this.searchCtrl.setValue(this.displayUser(member), { emitEvent: false });
  }

  onSubmit() {
    if (this.loading || !this.group || !this.selectedMember) return;

    this.loading = true;
    this.error = null;

    this.groupsService.addMemberToGroup(this.group.id, this.selectedMember.id).subscribe({
      next: () => this.dialogRef.close('added'),
      error: (err) => {
        this.error =
          err?.friendlyMessage ||
          (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : err?.error?.message) ||
          'An error occurred while adding the member to the group';
        this.loading = false;
      },
    });
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  trackById = (_: number, u: UserBaseDto) => u.id;
}
