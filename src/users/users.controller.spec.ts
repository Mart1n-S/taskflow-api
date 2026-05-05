import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './enums/user-role.enum';
import type { User } from './entities/user.entity';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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

const adminPayload: JwtPayload = {
  id: mockUser.id,
  email: mockUser.email,
  role: UserRole.ADMIN,
};

describe('UsersController', () => {
  let controller: UsersController;
  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findOneMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(mockUser);
    findAllMock = jest.fn().mockResolvedValue([mockUser]);
    findOneMock = jest.fn().mockResolvedValue(mockUser);
    updateMock = jest.fn().mockResolvedValue(mockUser);
    removeMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            findOne: findOneMock,
            update: updateMock,
            remove: removeMock,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create et retourne l utilisateur cree', async () => {
      const dto = {
        email: 'bob@test.com',
        name: 'Bob',
        password: 'secret',
        role: UserRole.MEMBER,
      };

      const result = await controller.create(dto);

      expect(createMock).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });

    it('propage ConflictException si l email est deja utilise', async () => {
      createMock.mockRejectedValue(new ConflictException());

      await expect(
        controller.create({
          email: 'alice@test.com',
          name: 'Alice',
          password: 'secret',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('retourne la liste des utilisateurs', async () => {
      const result = await controller.findAll();

      expect(findAllMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('retourne l utilisateur correspondant a l id', async () => {
      const result = await controller.findOne(mockUser.id);

      expect(findOneMock).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('propage NotFoundException si l utilisateur est introuvable', async () => {
      findOneMock.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id, dto et currentUser', async () => {
      const dto = { name: 'Alice Updated' };

      const result = await controller.update(mockUser.id, dto, adminPayload);

      expect(updateMock).toHaveBeenCalledWith(mockUser.id, dto, adminPayload);
      expect(result).toEqual(mockUser);
    });

    it('propage ForbiddenException si l utilisateur n a pas le droit', async () => {
      updateMock.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update('autre-id', { name: 'Test' }, adminPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('propage NotFoundException si l utilisateur est introuvable', async () => {
      updateMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { name: 'Test' }, adminPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockUser.id);

      expect(removeMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('propage NotFoundException si l utilisateur est introuvable', async () => {
      removeMock.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
