import { Component, inject } from '@angular/core';
import { ExpenseBaseDto } from '../../../feature/expenses/data/expense-base.dto';
import { ExpenseService } from '../../../feature/expenses/expense.service';
import { Router } from '@angular/router';
import { ExpenseGridComponent } from '../../../shared/components/expense-grid/expense-grid.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-expenses-missed',
  imports: [ExpenseGridComponent, NgIf],
  templateUrl: './expenses-missed.component.html',
  styleUrl: './expenses-missed.component.scss'
})
export class ExpensesMissedComponent {
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
        // Optional: sort newest first
        this.expenses = [...expenses].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching missed expenses:', err);
        this.error = (err?.error?.message || err?.message || 'Failed to load expenses');
        this.loading = false;
      }
    });
  }

  onOpenExpense(expense: ExpenseBaseDto) {
    // Navigate to your expense details/review route — adjust as needed
    this.router.navigate([`/expenses/${expense.id}/group/${expense.groupId}`]);
  }

  reload() {
    this.fetchMissed();
  }
}
