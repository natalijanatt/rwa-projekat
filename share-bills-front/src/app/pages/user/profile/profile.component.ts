import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { selectUser } from '../../../core/auth/state/auth.selectors';
import { AuthActions } from '../../../core/auth/state/auth.actions';
import { UserDto } from '../../../feature/users/data/user.dto';
import { UserUpdateComponent } from '../user-update/user-update.component';
import { LogoutConfirmationDialogComponent } from '../../../shared/components/logout-confirmation-dialog/logout-confirmation-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private sub = new Subscription();
  
  user$ = this.store.select(selectUser);
  user: UserDto | null = null;

  ngOnInit() {
    this.sub.add(
      this.user$.subscribe(user => {
        this.user = user ? { ...user } : null;
        if (!this.user) {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onUpdateProfile() {
    if (!this.user) return;

    const ref = this.dialog.open(UserUpdateComponent, {
      data: { user: this.user },
      disableClose: false,
      width: '720px',
      panelClass: 'app-modal-panel',
      backdropClass: 'app-modal-backdrop',
    });

    ref.afterClosed().subscribe((result) => {
      if (result === 'updated') {
        this.store.dispatch(AuthActions.loadUser());
      }
    });
  }

  onLogout() {
    const ref = this.dialog.open(LogoutConfirmationDialogComponent, {
      disableClose: false,
      width: '420px',
      maxWidth: '90vw',
      panelClass: 'logout-dialog-panel',
      backdropClass: 'app-modal-backdrop',
      hasBackdrop: true,
      autoFocus: true,
      restoreFocus: true
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(AuthActions.logout());
      }
    });
  }
}
