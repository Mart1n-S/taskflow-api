import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';
import {
  createMockRepository,
  type MockRepository,
} from '../common/helpers/mock-repository.helper';

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

const mockTeam: Team = {
  id: 'team-uuid-001',
  name: 'Team Alpha',
  description: 'Equipe principale',
  members: [],
  projects: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeQueryError = (code: string): QueryFailedError =>
  Object.assign(new QueryFailedError('INSERT', [], new Error('db error')), {
    code,
  });

describe('TeamsService', () => {
  let service: TeamsService;
  let repo: MockRepository<Team>;
  let findOneUserMock: jest.Mock;

  beforeEach(async () => {
    repo = createMockRepository<Team>();
    findOneUserMock = jest.fn().mockResolvedValue(mockUser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: repo },
        { provide: UsersService, useValue: { findOne: findOneUserMock } },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('retourne la liste des equipes avec leurs membres', async () => {
      repo.find.mockResolvedValue([mockTeam]);

      const result = await service.findAll();

      expect(result).toEqual([mockTeam]);
      expect(repo.find).toHaveBeenCalledWith({ relations: ['members'] });
    });

    it('retourne un tableau vide si aucune equipe', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('retourne l equipe avec membres et projets', async () => {
      repo.findOne.mockResolvedValue(mockTeam);

      const result = await service.findOne(mockTeam.id);

      expect(result).toEqual(mockTeam);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTeam.id },
        relations: ['members', 'projects'],
      });
    });

    it('leve NotFoundException si l equipe est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('cree et retourne l equipe', async () => {
      repo.create.mockReturnValue(mockTeam);
      repo.save.mockResolvedValue(mockTeam);

      const result = await service.create({ name: 'Team Alpha' });

      expect(result).toEqual(mockTeam);
    });

    it('leve ConflictException si le nom est deja utilise (23505)', async () => {
      repo.create.mockReturnValue(mockTeam);
      repo.save.mockRejectedValue(makeQueryError('23505'));

      await expect(service.create({ name: 'Team Alpha' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('re-lance l erreur pour tout autre code SQL', async () => {
      repo.create.mockReturnValue(mockTeam);
      repo.save.mockRejectedValue(makeQueryError('99999'));

      await expect(service.create({ name: 'Team Alpha' })).rejects.toThrow(
        QueryFailedError,
      );
    });
  });

  describe('update', () => {
    it('met a jour le nom de l equipe', async () => {
      const updated = { ...mockTeam, name: 'Team Beta' };
      repo.findOne.mockResolvedValue({ ...mockTeam });
      repo.save.mockResolvedValue(updated);

      const result = await service.update(mockTeam.id, { name: 'Team Beta' });

      expect(result.name).toBe('Team Beta');
    });

    it('leve NotFoundException si l equipe est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime l equipe existante', async () => {
      repo.findOne.mockResolvedValue(mockTeam);
      repo.remove.mockResolvedValue(mockTeam);

      await expect(service.remove(mockTeam.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockTeam);
    });

    it('leve NotFoundException si l equipe est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addMember', () => {
    it('ajoute un membre a l equipe', async () => {
      const teamWithMember = { ...mockTeam, members: [mockUser] };
      repo.findOne.mockResolvedValue({ ...mockTeam, members: [] });
      repo.save.mockResolvedValue(teamWithMember);

      const result = await service.addMember(mockTeam.id, mockUser.id);

      expect(findOneUserMock).toHaveBeenCalledWith(mockUser.id);
      expect(result.members).toContain(mockUser);
    });

    it('leve ConflictException si l utilisateur est deja membre', async () => {
      repo.findOne.mockResolvedValue({ ...mockTeam, members: [mockUser] });

      await expect(service.addMember(mockTeam.id, mockUser.id)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('leve NotFoundException si l equipe est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.addMember('id-inexistant', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('leve NotFoundException si l utilisateur est introuvable', async () => {
      repo.findOne.mockResolvedValue({ ...mockTeam, members: [] });
      findOneUserMock.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.addMember(mockTeam.id, 'id-inexistant'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('retire un membre de l equipe', async () => {
      const teamWithMember = { ...mockTeam, members: [mockUser] };
      repo.findOne.mockResolvedValue({ ...teamWithMember });
      repo.save.mockResolvedValue({ ...mockTeam, members: [] });

      const result = await service.removeMember(mockTeam.id, mockUser.id);

      expect(result.members).toHaveLength(0);
    });

    it('leve NotFoundException si l equipe est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.removeMember('id-inexistant', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('leve NotFoundException si l utilisateur est introuvable', async () => {
      repo.findOne.mockResolvedValue({ ...mockTeam, members: [mockUser] });
      findOneUserMock.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.removeMember(mockTeam.id, 'id-inexistant'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
