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
export type MockRepository<T extends object> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
} & Partial<Repository<T>>;

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
});
