import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(userId: number) {
    super(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class GroupNotFoundException extends HttpException {
  constructor(groupId: number) {
    super(`Group with ID ${groupId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ExpenseNotFoundException extends HttpException {
  constructor(expenseId: number) {
    super(`Expense with ID ${expenseId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedAccessException extends HttpException {
  constructor(resource: string) {
    super(`Unauthorized access to ${resource}`, HttpStatus.FORBIDDEN);
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

