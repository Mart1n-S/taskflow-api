import type { Repository } from 'typeorm';

/**
 * Creates a mocked TypeORM repository for unit testing.
 * All repository methods are replaced with Jest mock functions.
 *
 * Usage:
 * ```ts
 * const repo = createMockRepository<User>();
 * repo.findOne.mockResolvedValue(mockUser);
 * ```
 */
export type MockQueryBuilder = {
  addSelect: jest.Mock;
  where: jest.Mock;
  getOne: jest.Mock;
};

export type MockRepository<T extends object> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
} & Partial<Repository<T>>;

export const createMockQueryBuilder = (): MockQueryBuilder => {
  const qb: MockQueryBuilder = {
    addSelect: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn().mockResolvedValue(null),
  };
  qb.addSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  return qb;
};

export const createMockRepository = <
  T extends object,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});
