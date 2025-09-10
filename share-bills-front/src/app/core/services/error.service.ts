import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ErrorDetails {
  message: string;
  status?: number;
  statusText?: string;
  originalError?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  
  //Handles HTTP errors and extracts user-friendly messages
  handleHttpError(err: HttpErrorResponse): Observable<never> {
    const errorDetails = this.extractErrorDetails(err);
    this.logError(errorDetails);
    return throwError(() => ({ ...err, friendlyMessage: errorDetails.message }));
  }

  //Extracts meaningful error message from HTTP error response
  private extractErrorDetails(err: HttpErrorResponse): ErrorDetails {
    let message = 'An unexpected error occurred';
    
    if (err.error?.message) {
      if (Array.isArray(err.error.message)) {
        message = err.error.message.join(', ');
      } else {
        message = err.error.message;
      }
    } else if (err.message) {
      message = err.message;
    }

    // Handle specific HTTP status codes
    switch (err.status) {
      case 400:
        message = message || 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Authentication required. Please log in.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'A conflict occurred. The resource may already exist.';
        break;
      case 422:
        message = message || 'Validation failed. Please check your input.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 0:
        message = 'Network error. Please check your connection.';
        break;
    }

    return {
      message,
      status: err.status,
      statusText: err.statusText,
      originalError: err.error
    };
  }

  //Logs error details (in production, this would send to monitoring service)
  private logError(errorDetails: ErrorDetails): void {
    // In development, you might want to log to console
    // In production, this should send to your monitoring service (e.g., Sentry, LogRocket)
    if (errorDetails.status && errorDetails.status >= 500) {
      // Log server errors for monitoring
      console.error('Server Error:', errorDetails);
    }
  }

  //Creates a user-friendly error message for display
  createUserFriendlyMessage(error: any): string {
    if (error?.friendlyMessage) {
      return error.friendlyMessage;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  //Checks if error is a network error
  isNetworkError(error: any): boolean {
    return error?.status === 0 || error?.name === 'NetworkError';
  }

  //Checks if error is a validation error
  isValidationError(error: any): boolean {
    return error?.status === 400 || error?.status === 422;
  }

  //Checks if error is an authentication error
  isAuthError(error: any): boolean {
    return error?.status === 401 || error?.status === 403;
  }
}
