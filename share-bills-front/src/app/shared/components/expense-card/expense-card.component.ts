import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-expense-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './expense-card.component.html',
  styleUrls: ['./expense-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseCardComponent {
  @Input() title = 'Expense';
  @Input() expenseId!: number | string;
  @Input() amount = 0;
  @Input() currencyCode: string = 'USD';

  /** Button label & click */
  @Input() buttonLabel = 'Open';
  @Output() buttonClicked = new EventEmitter<void>();

  /** Optional gradient accents (CSS color values) */
  @Input() accentFrom: string = '#000000';
  @Input() accentVia: string = '#7c2d12';   // orange-900-ish
  @Input() accentTo: string = '#4f46e5';    // indigo-600-ish
}
