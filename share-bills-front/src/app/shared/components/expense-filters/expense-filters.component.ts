import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { selectUser } from '../../../core/auth/state/auth.selectors';
import { GroupService } from '../../../feature/groups/group.service';
import { GroupBaseDto } from '../group-card/group-card.component';
import { GroupMemberBaseDto } from '../../../feature/groups/data/group-member-base.dto';
import { ExpenseFilterDto } from '../../../feature/expenses/data/expense-filter.dto';


@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './expense-filters.component.html',
  styleUrl: './expense-filters.component.scss',
})
export class ExpenseFiltersComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private groupService = inject(GroupService);

  /** Optional: can be provided by parent. If empty, we fetch on init. */
  @Input() groups: GroupBaseDto[] = [];
  @Output() filtersChange = new EventEmitter<ExpenseFilterDto>();

  members: GroupMemberBaseDto[] = [];
  private userId: number | null = null;

  form = this.fb.nonNullable.group({
    groupId: null as number | null,
    status: '' as 'accepted' | 'declined', // '' = Any
    paidBy: null as number | null,
    ordredBy: 'createdAt' as 'createdAt' | 'amount' | 'title',
    orderDirection: 'DESC' as 'ASC' | 'DESC',
    page: 1,
  });

  ngOnInit() {
    // Current user id (always included in filters)
    this.store.select(selectUser)
      .pipe()
      .subscribe(u => { this.userId = u?.id ?? null; });

    // Load groups if not passed in
    if (!this.groups?.length) {
      this.groupService.getAllGroups()
        .pipe()
        .subscribe(gs => this.groups = gs ?? []);
    }
  }

  onGroupChange(groupId: number | null) {
    // Reset paidBy on group change
    this.form.patchValue({ paidBy: null });

    if (groupId == null) {
      this.members = [];
      this.form.patchValue({ groupId: null });
      return;
    }

    this.groupService.getGroupById(groupId)
      .pipe()
      .subscribe(group => {
        this.members = group?.members || [];
        this.form.patchValue({ groupId: group?.id ?? null });
      });
  }

  applyFilters() {
    const raw = this.form.getRawValue();

    const filters: ExpenseFilterDto = {
      userId: this.userId ?? undefined,              // always added
      groupId: raw.groupId ?? undefined,             // optional
      status: raw.status || undefined,               // selectable
      paidBy: raw.paidBy ?? undefined,
      ordredBy: raw.ordredBy,
      orderDirection: raw.orderDirection,
      page: 1,
    };

    this.filtersChange.emit(filters);
  }

  resetFilters() {
    this.members = [];
    this.form.reset({
      groupId: null,
      status: '' as 'accepted' | 'declined',
      paidBy: null,
      ordredBy: 'createdAt',
      orderDirection: 'DESC',
      page: 1,
    }, { emitEvent: false });

    this.applyFilters();
  }

  groupsTrackBy = (_: number, g: GroupBaseDto) => g?.id;
  membersTrackBy = (_: number, m: GroupMemberBaseDto) => m?.id;
}
