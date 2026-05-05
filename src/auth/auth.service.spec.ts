jest.mock('bcrypt');
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';

const mockUserWithHash: User = {
  id: 'user-uuid-001',
  email: 'alice@test.com',
  name: 'Alice',
  role: UserRole.ADMIN,
  passwordHash: '$2b$10$hashedpassword',
  teams: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmailWithPassword'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmailWithPassword: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('retourne le user sans passwordHash si les credentials sont corrects', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUserWithHash,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('alice@test.com', 'password');

      expect(result).toEqual({
        id: mockUserWithHash.id,
        email: mockUserWithHash.email,
        name: mockUserWithHash.name,
        role: mockUserWithHash.role,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('retourne null si le user est introuvable', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.validateUser('nobody@test.com', 'password');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('retourne null si le mot de passe est incorrect', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUserWithHash,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('alice@test.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const authUser = {
      id: mockUserWithHash.id,
      email: mockUserWithHash.email,
      name: mockUserWithHash.name,
      role: mockUserWithHash.role,
    };

    it('retourne access_token + user sans passwordHash', () => {
      const result = service.login(authUser);

      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user).toEqual(authUser);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('signe le JWT avec sub, email et role', () => {
      service.login(authUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: authUser.id,
        email: authUser.email,
        role: authUser.role,
      });
    });
  });
});
