import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('Invalid or missing user id in JWT');
    }
    
    return Number(userId);
  },
);

