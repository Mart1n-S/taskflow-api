import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';
import type { LoginResponse } from './interfaces/login-response.interface';

const mockUser: User = {
  id: 'user-uuid-001',
  email: 'alice@test.com',
  name: 'Alice',
  role: UserRole.ADMIN,
  passwordHash: '$2b$10$hash',
  teams: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLoginResponse: LoginResponse = {
  access_token: 'signed.jwt.token',
  user: {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
  },
};

describe('AuthController', () => {
  let controller: AuthController;
  let loginMock: jest.Mock;
  let findOneMock: jest.Mock;

  beforeEach(async () => {
    loginMock = jest.fn().mockReturnValue(mockLoginResponse);
    findOneMock = jest.fn().mockResolvedValue(mockUser);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { login: loginMock } },
        { provide: UsersService, useValue: { findOne: findOneMock } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('appelle authService.login avec req.user et retourne le token', () => {
      const reqUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      };
      const req = { user: reqUser } as never;

      const result = controller.login(req);

      expect(loginMock).toHaveBeenCalledWith(reqUser);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('me', () => {
    it('appelle usersService.findOne avec user.id et retourne le profil', async () => {
      const currentUser = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      const result = await controller.me(currentUser);

      expect(findOneMock).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });
});
