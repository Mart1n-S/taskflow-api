import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '../../users/enums/user-role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('transforme le payload brut en JwtPayload (sub -> id)', () => {
      const rawPayload = {
        sub: 'user-uuid-001',
        email: 'alice@test.com',
        role: UserRole.ADMIN,
      };

      const result = strategy.validate(rawPayload);

      expect(result).toEqual({
        id: 'user-uuid-001',
        email: 'alice@test.com',
        role: UserRole.ADMIN,
      });
    });

    it('ne retourne pas sub dans le resultat', () => {
      const rawPayload = {
        sub: 'user-uuid-001',
        email: 'alice@test.com',
        role: UserRole.MEMBER,
      };

      const result = strategy.validate(rawPayload);

      expect(result).not.toHaveProperty('sub');
      expect(result).toHaveProperty('id', 'user-uuid-001');
    });
  });
});
