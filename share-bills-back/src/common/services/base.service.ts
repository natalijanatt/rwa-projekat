import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface SearchOptions {
  searchFields: string[];
  searchTerm?: string;
}

export abstract class BaseService<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  protected createBaseQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  protected applyPagination(
    qb: SelectQueryBuilder<T>,
    options: PaginationOptions = {}
  ): SelectQueryBuilder<T> {
    const { page = 1, limit = 10, orderBy, orderDirection = 'DESC' } = options;
    
    qb.skip((page - 1) * limit).take(limit);
    
    if (orderBy) {
      qb.orderBy(`${qb.alias}.${orderBy}`, orderDirection);
    }
    
    return qb;
  }

  protected applySearch(
    qb: SelectQueryBuilder<T>,
    options: SearchOptions
  ): SelectQueryBuilder<T> {
    const { searchFields, searchTerm } = options;
    
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields
        .map(field => `${qb.alias}.${field} LIKE :searchTerm`)
        .join(' OR ');
      
      qb.andWhere(`(${searchConditions})`, {
        searchTerm: `%${searchTerm}%`
      });
    }
    
    return qb;
  }

  protected async paginate(
    qb: SelectQueryBuilder<T>,
    options: PaginationOptions = {}
  ): Promise<{ items: T[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10 } = options;
    
    const [items, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    
    return {
      items,
      total,
      page,
      totalPages
    };
  }
}
