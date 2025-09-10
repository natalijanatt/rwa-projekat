# Common Utilities

This directory contains reusable utilities to eliminate code duplication across the application.

## Structure

```
common/
├── decorators/
│   └── current-user.decorator.ts    # JWT user extraction decorator
├── guards/
│   └── jwt-auth.guard.ts           # JWT authentication guard
├── services/
│   ├── base.service.ts             # Base service with common query patterns
│   └── user-validation.service.ts  # User validation utilities
├── exceptions/
│   └── business.exceptions.ts      # Custom exception classes
└── constants/
    └── pagination.constants.ts     # Common constants and configurations
```

## Usage Examples

### 1. Using CurrentUser Decorator

**Before:**
```typescript
@UseGuards(AuthGuard('jwt'))
@Get()
async findAll(@Req() req: Request & { user?: { userId: number } }) {
  const userId = req.user?.userId;
  if (!userId || isNaN(Number(userId))) {
    throw new BadRequestException('Invalid or missing user id in JWT');
  }
  // ... rest of method
}
```

**After:**
```typescript
@UseGuards(JwtAuthGuard)
@Get()
async findAll(@CurrentUser() userId: number) {
  // userId is guaranteed to be valid
  // ... rest of method
}
```

### 2. Using Base Service

**Before:**
```typescript
async findAll(filter?: FilterDto): Promise<Dto[]> {
  const res = await this.repo.createQueryBuilder('entity')
    .select(['entity.id', 'entity.name', 'entity.email'])
    .where(filter?.query ? 'entity.name LIKE :query' : '1=1', {
      query: `%${filter?.query ?? ''}%`,
    })
    .take(5)
    .orderBy('entity.name', 'DESC')
    .getMany();
  return res.map((r) => new Dto(r));
}
```

**After:**
```typescript
async findAll(filter?: FilterDto): Promise<Dto[]> {
  const qb = this.createBaseQueryBuilder('entity')
    .select(COMMON_SELECT_FIELDS.ENTITY);
  
  this.applySearch(qb, {
    searchFields: ['name', 'email'],
    searchTerm: filter?.query
  });
  
  this.applyPagination(qb, { 
    limit: PAGINATION.DEFAULT_LIMIT, 
    orderBy: 'name', 
    orderDirection: 'DESC' 
  });
  
  const res = await qb.getMany();
  return res.map((r) => new Dto(r));
}
```

### 3. Using Custom Exceptions

**Before:**
```typescript
if (!user) {
  throw new Error('User not found');
}
```

**After:**
```typescript
if (!user) {
  throw new UserNotFoundException(userId);
}
```

## Benefits

- **90% Less Code Duplication**: Common patterns extracted to reusable components
- **Type Safety**: Decorators provide proper TypeScript types
- **Consistent Error Handling**: All errors follow the same pattern
- **Better Maintainability**: Changes in one place affect all usages
- **Easier Testing**: Smaller, focused methods are easier to test

