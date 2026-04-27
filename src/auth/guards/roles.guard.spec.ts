import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * Helper that creates a mocked ExecutionContext with a user of the given role.
 * Simulates what JwtStrategy.validate() would attach to request.user.
 */
const createMockContext = (role: string): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'uuid', email: 'test@test.com', role },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  /**
   * Creates a fresh TestingModule before each test.
   * RolesGuard depends on Reflector - both are provided here.
   */
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('autorise si aucun rôle requis (pas de @Roles)', () => {
    // Simule une route sans décorateur @Roles()
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = createMockContext(UserRole.VIEWER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('autorise si le rôle correspond', () => {
    // Route réservée aux ADMIN - user est ADMIN
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('refuse si le rôle est insuffisant', () => {
    // Route réservée aux ADMIN - user est VIEWER
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext(UserRole.VIEWER);
    expect(guard.canActivate(context)).toBe(false);
  });

  it("autorise si plusieurs rôles acceptés et l'un correspond", () => {
    // Route accessible aux ADMIN et MEMBER - user est MEMBER
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.MEMBER]);

    const context = createMockContext(UserRole.MEMBER);
    expect(guard.canActivate(context)).toBe(true);
  });
});
