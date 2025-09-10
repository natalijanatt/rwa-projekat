import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseBaseDto } from '../../../feature/expenses/data/expense-base.dto';
import { ExpenseService } from '../../../feature/expenses/expense.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expenses-missed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expenses-missed.component.html',
  styleUrl: './expenses-missed.component.scss'
})
export class ExpensesMissedComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private router = inject(Router);

  expenses: ExpenseBaseDto[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.fetchMissed();
  }

  fetchMissed() {
    this.loading = true;
    this.error = null;

    this.expenseService.getMissedExpenses().subscribe({
      next: (expenses: ExpenseBaseDto[]) => {
        this.expenses = [...expenses].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        this.error = (err?.error?.message || err?.message || 'Failed to load expenses');
        this.loading = false;
      }
    });
  }

  onOpenExpense(expense: ExpenseBaseDto) {
    this.router.navigate([`/expenses/${expense.id}/group/${expense.groupId}`]);
  }

  onAcceptExpense(expense: ExpenseBaseDto) {
    this.expenseService.respondLate(expense.id, expense.groupId, 'accepted'
    ).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== expense.id);
      },
      error: (err) => {
        this.error = (err?.error?.message || err?.message || 'Failed to accept expense');
      }
    });    
  }

  onDeclineExpense(expense: ExpenseBaseDto) {
    this.expenseService.respondLate(expense.id, expense.groupId, 'declined'
    ).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== expense.id);
      },
      error: (err) => {
        this.error = (err?.error?.message || err?.message || 'Failed to decline expense');
      }
    });
  }

  reload() {
    this.fetchMissed();
  }

  trackByExpenseId(index: number, expense: ExpenseBaseDto): number {
    return expense.id;
  }
}
