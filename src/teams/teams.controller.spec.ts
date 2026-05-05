import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { UserRole } from '../users/enums/user-role.enum';
import type { Team } from './entities/team.entity';

const mockUser = {
  id: 'user-uuid-001',
  email: 'alice@test.com',
  name: 'Alice',
  role: UserRole.ADMIN,
  passwordHash: '$2b$10$hash',
  teams: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTeam: Team = {
  id: 'team-uuid-001',
  name: 'Team Alpha',
  description: 'Equipe principale',
  members: [],
  projects: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TeamsController', () => {
  let controller: TeamsController;
  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findOneMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;
  let addMemberMock: jest.Mock;
  let removeMemberMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(mockTeam);
    findAllMock = jest.fn().mockResolvedValue([mockTeam]);
    findOneMock = jest.fn().mockResolvedValue(mockTeam);
    updateMock = jest.fn().mockResolvedValue(mockTeam);
    removeMock = jest.fn().mockResolvedValue(undefined);
    addMemberMock = jest
      .fn()
      .mockResolvedValue({ ...mockTeam, members: [mockUser] });
    removeMemberMock = jest
      .fn()
      .mockResolvedValue({ ...mockTeam, members: [] });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: {
            create: createMock,
            findAll: findAllMock,
            findOne: findOneMock,
            update: updateMock,
            remove: removeMock,
            addMember: addMemberMock,
            removeMember: removeMemberMock,
          },
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create et retourne l equipe creee', async () => {
      const dto = { name: 'Team Alpha' };

      const result = await controller.create(dto);

      expect(createMock).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTeam);
    });

    it('propage ConflictException si le nom est deja utilise', async () => {
      createMock.mockRejectedValue(new ConflictException());

      await expect(controller.create({ name: 'Team Alpha' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('retourne la liste des equipes', async () => {
      const result = await controller.findAll();

      expect(findAllMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTeam]);
    });
  });

  describe('findOne', () => {
    it('retourne l equipe correspondante a l id', async () => {
      const result = await controller.findOne(mockTeam.id);

      expect(findOneMock).toHaveBeenCalledWith(mockTeam.id);
      expect(result).toEqual(mockTeam);
    });

    it('propage NotFoundException si l equipe est introuvable', async () => {
      findOneMock.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id et dto', async () => {
      const dto = { name: 'Team Beta' };

      const result = await controller.update(mockTeam.id, dto);

      expect(updateMock).toHaveBeenCalledWith(mockTeam.id, dto);
      expect(result).toEqual(mockTeam);
    });

    it('propage NotFoundException si l equipe est introuvable', async () => {
      updateMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockTeam.id);

      expect(removeMock).toHaveBeenCalledWith(mockTeam.id);
    });

    it('propage NotFoundException si l equipe est introuvable', async () => {
      removeMock.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addMember', () => {
    it('appelle service.addMember et retourne l equipe mise a jour', async () => {
      const result = await controller.addMember(mockTeam.id, mockUser.id);

      expect(addMemberMock).toHaveBeenCalledWith(mockTeam.id, mockUser.id);
      expect(result.members).toHaveLength(1);
    });

    it('propage ConflictException si l utilisateur est deja membre', async () => {
      addMemberMock.mockRejectedValue(new ConflictException());

      await expect(
        controller.addMember(mockTeam.id, mockUser.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('appelle service.removeMember et retourne l equipe mise a jour', async () => {
      const result = await controller.removeMember(mockTeam.id, mockUser.id);

      expect(removeMemberMock).toHaveBeenCalledWith(mockTeam.id, mockUser.id);
      expect(result.members).toHaveLength(0);
    });

    it('propage NotFoundException si l utilisateur est introuvable', async () => {
      removeMemberMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.removeMember(mockTeam.id, 'id-inexistant'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
