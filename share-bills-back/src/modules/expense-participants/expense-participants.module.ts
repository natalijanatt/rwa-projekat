import { Module } from '@nestjs/common';
import { ExpenseParticipantsService } from './expense-participants.service';

@Module({
  providers: [ExpenseParticipantsService]
})
export class ExpenseParticipantsModule {}
