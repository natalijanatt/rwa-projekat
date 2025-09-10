import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-logout-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">
        <span class="title-icon">🚪</span>
        Confirm Logout
      </h2>
      
      <div mat-dialog-content class="dialog-content">
        <p class="confirmation-message">
          Are you sure you want to log out?<br>
          You will need to sign in again to access your account.
        </p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          class="cancel-button" 
          (click)="onCancel()"
          cdkFocusInitial>
          Cancel
        </button>
        <button 
          mat-raised-button 
          class="confirm-button" 
          (click)="onConfirm()">
          Log Out
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .dialog-container {
      padding: 0;
      width: 420px;
      max-width: 90vw;
      background: #1e1e1e;
      border-radius: 12px;
      overflow: hidden;
      box-sizing: border-box;
      margin: 0 auto;
      position: relative;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 24px 24px 16px 24px;
      font-size: 1.375rem;
      font-weight: 600;
      color: #ffffff;
      background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%);
      border-bottom: 1px solid #333;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
    }
    
    .title-icon {
      font-size: 1.75rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
    
    .dialog-content {
      margin: 0;
      padding: 24px;
      background: #1e1e1e;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .confirmation-message {
      margin: 0;
      color: #b0b0b0;
      line-height: 1.6;
      font-size: 1rem;
      text-align: center;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 0;
      padding: 20px 24px 24px 24px;
      background: #1e1e1e;
      border-top: 1px solid #333;
      box-sizing: border-box;
      overflow: hidden;
      flex-wrap: wrap;
    }
    
    .cancel-button {
      min-width: 100px;
      max-width: 120px;
      height: 40px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      text-transform: none;
      background: #333;
      color: #ffffff;
      border: 1px solid #444;
      transition: all 0.2s ease;
      flex: 1;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .cancel-button:hover {
      background: #444;
      border-color: #555;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .confirm-button {
      min-width: 100px;
      max-width: 120px;
      height: 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: none;
      background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
      color: white;
      border: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3);
      flex: 1;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .confirm-button:hover {
      background: linear-gradient(135deg, #ff5555 0%, #dd0000 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(255, 68, 68, 0.4);
    }
    
    .confirm-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3);
    }
  `]
})
export class LogoutConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<LogoutConfirmationDialogComponent, boolean>);

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
