// expense.finalizer.service.ts
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { ExpenseParticipantsService } from '../expense-participants/expense-participants.service';

@Injectable()
export class ExpenseFinalizerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(ExpenseFinalizerService.name);
  private timers = new Map<number, NodeJS.Timeout>();
  private participants?: ExpenseParticipantsService;

  constructor(
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
  ) {}

  private async getParticipants() {
    if (!this.participants) {
      // lazy resolve to avoid circular DI timing issues
      this.participants = await this.moduleRef.resolve(
        ExpenseParticipantsService,
        undefined,
        { strict: false },
      );
    }
    return this.participants;
  }

  async onModuleInit() {
  const open = await this.expenseRepo.createQueryBuilder('e')
    .select(['e.id', 'e.acceptanceDeadline'])
    .where('e.finalizedAt IS NULL')
    .getMany();

  const now = Date.now();
  const future = open.filter(e => new Date(e.acceptanceDeadline).getTime() > now);
  const expired = open.filter(e => new Date(e.acceptanceDeadline).getTime() <= now);

  // schedule only future deadlines
  for (const e of future) this.schedule(e.id, new Date(e.acceptanceDeadline));

  // process expired in small batches to avoid DB pool stampede
  this.drainExpiredQueue(expired.map(e => e.id));
}

private draining = false;

private async drainExpiredQueue(ids: number[], concurrency = 2, gapMs = 250) {
  if (this.draining || ids.length === 0) return;
  this.draining = true;

  const queue = [...ids];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const id = queue.shift()!;
      try {
        const participants = await this.getParticipants();
        await participants.finalizeIfExpired(id, { force: true });
      } catch (e) {
        this.log.warn(`Boot finalize failed for ${id}: ${String(e)}`);
      }
      await new Promise(r => setTimeout(r, gapMs)); // gentle pacing
    }
  });

  await Promise.all(workers);
  this.draining = false;
}


  onModuleDestroy() {
    for (const [, t] of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  schedule(expenseId: number, deadlineOrDelay: Date | number) {
    const baseDelay =
      typeof deadlineOrDelay === 'number'
        ? Math.max(0, deadlineOrDelay)
        : Math.max(0, new Date(deadlineOrDelay).getTime() - Date.now());

        const min = 1000;                 // at least 1s
  const jitter = Math.floor(Math.random() * 1000); // +0..999ms
  const delay = Math.max(min, baseDelay) + jitter;
    this.cancel(expenseId);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const participants = await this.getParticipants();
          await participants.finalizeIfExpired(expenseId, { force: true });
        } catch (e) {
          this.log.warn(`Finalize timer failed for expense ${expenseId}: ${String(e)}`);
        } finally {
          this.timers.delete(expenseId);
        }
      })();
    }, delay);

    this.timers.set(expenseId, timer);
  }

  cancel(expenseId: number) {
    const t = this.timers.get(expenseId);
    if (t) {
      clearTimeout(t);
      this.timers.delete(expenseId);
    }
  }
}
