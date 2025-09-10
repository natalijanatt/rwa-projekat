import { forwardRef, Global, Module } from '@nestjs/common';
import { UserEventBus } from './user-event.bus';
import { RealtimeController } from './realtime.controller';
import { ExpenseParticipantsModule } from 'src/modules/expense-participants/expense-participants.module';

@Global()
@Module({
  imports: [forwardRef(() => ExpenseParticipantsModule)],
  providers: [UserEventBus],
  controllers: [RealtimeController],
  exports: [UserEventBus],
})
export class RealtimeModule {}