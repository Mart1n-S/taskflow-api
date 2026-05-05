import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UserRole } from '../../users/enums/user-role.enum';

const validUser = {
  id: 'user-uuid-001',
  email: 'alice@test.com',
  name: 'Alice',
  role: UserRole.ADMIN,
};

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<Pick<AuthService, 'validateUser'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: { validateUser: jest.fn() },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('retourne le user si les credentials sont valides', async () => {
    (authService.validateUser as jest.Mock).mockResolvedValue(validUser);

    const result = await strategy.validate('alice@test.com', 'password');

    expect(result).toEqual(validUser);
    expect(authService.validateUser).toHaveBeenCalledWith(
      'alice@test.com',
      'password',
    );
  });

  it('leve UnauthorizedException si validateUser retourne null', async () => {
    (authService.validateUser as jest.Mock).mockResolvedValue(null);

    await expect(strategy.validate('wrong@test.com', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
