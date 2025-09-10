export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  USER_SEARCH_LIMIT: 5,
  EXPENSE_PAGE_SIZE: 10,
} as const;

export const ORDER_DIRECTION = {
  ASC: 'ASC' as const,
  DESC: 'DESC' as const,
} as const;

export const COMMON_SELECT_FIELDS = {
  USER: ['id', 'name', 'email', 'imagePath'] as string[],
  GROUP: ['id', 'name', 'imagePath', 'baseCurrencyCode', 'ownerId'] as string[],
} as const;


export const getSelectFields = (alias: string, fields: string[]): string[] => {
  return fields.map(field => `${alias}.${field}`);
};
