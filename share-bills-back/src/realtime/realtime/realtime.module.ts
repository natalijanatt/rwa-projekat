import { Global, Module } from '@nestjs/common';
import { PendingExpenseBus } from '../pending-expense.bus';

@Global()
@Module({
  providers: [PendingExpenseBus],
  exports: [PendingExpenseBus],
})
export class RealtimeModule {}