import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ExpenseCardComponent } from '../expense-card/expense-card.component';
import { BaseExpenseDto } from '../../../feature/expenses/data/expense-base.dto';

@Component({
  selector: 'app-expense-grid',
  standalone: true,
  imports: [CommonModule, ExpenseCardComponent],
  templateUrl: './expense-grid.component.html',
  styleUrls: ['./expense-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseGridComponent {
  @Input() expenses: BaseExpenseDto[] = [];
  @Input() currencyCode: string = 'EUR';
  @Input() buttonLabel = 'Review';

  @Output() openExpense = new EventEmitter<BaseExpenseDto>();

  trackById = (_: number, e: BaseExpenseDto) => e.id;

  /** Simple palette variation by type / status */
  palette(e: BaseExpenseDto) {
    const isTransfer = (e.txnType || '').toLowerCase() === 'transfer';
    const isFinal = !!e.finalizedAt;

    if (isTransfer) {
      // Cool palette for transfers
      return { from: '#000000', via: '#0f766e', to: '#2563eb' }; // black → teal → blue
    }
    if (!isFinal) {
      // Pending-looking palette
      return { from: '#000000', via: '#7c2d12', to: '#f59e0b' }; // black → orange-900 → amber
    }
    // Default (finalized expense)
    return { from: '#000000', via: '#7c2d12', to: '#4f46e5' };   // black → orange-900 → indigo
  }

  onOpen(expense: BaseExpenseDto) {
    this.openExpense.emit(expense);
  }
}