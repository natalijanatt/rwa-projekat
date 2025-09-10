import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { NgIf, NgFor, NgOptimizedImage, NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  finalize,
  map,
  distinctUntilChanged,
  switchMap,
  filter,
} from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GroupService } from '../../../feature/groups/group.service';
import { GroupFullDto } from '../../../feature/groups/data/group-full.dto';
import { GroupMemberBaseDto } from '../../../feature/groups/data/group-member-base.dto';
import { GroupUpdateComponent } from '../../../pages/groups/group-update/group-update.component';
import { GroupAddMemberComponent } from '../../../pages/groups/group-add-member/group-add-member.component';
import { ExpenseCreateComponent } from '../expense-create/expense-create.component';

@Component({
  selector: 'app-group-view',
  standalone: true,
  imports: [NgIf, NgFor, NgOptimizedImage, MatDialogModule],
  templateUrl: './group-view.component.html',
  styleUrl: './group-view.component.scss',
})
export class GroupViewComponent {
  private route = inject(ActivatedRoute);
  private groups = inject(GroupService);
  private dialog = inject(MatDialog);

  group = signal<GroupFullDto | null>(null);
  loading = signal(false);

  @Output() addExpense = new EventEmitter<number>();
  @Output() updateGroup = new EventEmitter<number>();
  @Output() addMember = new EventEmitter<number>();

  ngOnInit() {
    this.route.paramMap
      .pipe(
        map((pm) => pm.get('id') ?? pm.get('groupId')),
        map((id) => (id ? Number(id) : NaN)),
        filter((id) => Number.isFinite(id) && id > 0),
        distinctUntilChanged(),
        switchMap((id) => {
          this.loading.set(true);
          return this.groups
            .getGroupById(id)
            .pipe(finalize(() => this.loading.set(false)));
        })
      )
      .subscribe({
        next: (g) => this.group.set(g),
        error: (err) => {
          // Error handling is done by ErrorService
        },
      });
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = 'assets/avatar-placeholder.webp';
  }
  onMemberImgError(e: Event) {
    (e.target as HTMLImageElement).src = 'assets/avatar-placeholder.webp';
  }

  get membersCount(): number {
    return this.group()?.members?.length ?? 0;
  }
  trackByMemberId(index: number, member: GroupMemberBaseDto): number {
    return member.id;
  }
  onUpdate() {
    const g = this.group();
    if (!g) return;

    const ref = this.dialog.open(GroupUpdateComponent, {
      data: { group: g },
      disableClose: false,
      width: '720px',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
    });

    ref.afterClosed().subscribe((result) => {
      if (result === 'updated') this.refreshCurrent();
    });
  }

  onAddMember() {
    const g = this.group();
    if (!g) return;

    const ref = this.dialog.open(GroupAddMemberComponent, {
      data: { group: g },
      disableClose: false,
      width: '720px',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
    });

    ref.afterClosed().subscribe((result) => {
      if (result === 'added') this.refreshCurrent();
    });
  }

  onAddExpense() {
    const g = this.group();
    if (!g) return;

    const ref = this.dialog.open(ExpenseCreateComponent, {
      data: { group: g },
      disableClose: false,
      width: '720px',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
    });

    ref.afterClosed().subscribe((result) => {
      if (result === 'added') this.refreshCurrent();
    });
  }

  private refreshCurrent() {
    const g = this.group();
    if (!g) return;
    this.loading.set(true);
    this.groups
      .getGroupById(g.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (v) => this.group.set(v),
        error: (err) => {
          // Error handling is done by ErrorService
        },
      });
  }

  memberBalance(member: GroupMemberBaseDto): { status: string; owed: boolean } {
    const g = this.group();

    if (!g) return { status: 'Loading...', owed: false };
    const balance = g.balances.find((b) => b.toMemberId === member.id);
    if (!balance) return { status: 'Me', owed: false };

    if (Number(balance.balance) === 0)
      return { status: 'Settled', owed: false };

    const currencyCode = g.baseCurrencyCode || 'USD';
    const formattedAmount = this.formatCurrency(Math.abs(balance.balance), currencyCode);

    if (balance.balance < 0)
      return { status: `ows ${formattedAmount}`, owed: false };
    return { status: `owed ${formattedAmount}`, owed: true };
  }

  private formatCurrency(amount: number, currencyCode: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Currency formatting error - fallback to original value
      // Fallback to simple formatting
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  }
}
