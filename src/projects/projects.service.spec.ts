import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { TeamsService } from '../teams/teams.service';
import { ProjectStatus } from './enums/project-status.enum';
import {
  createMockRepository,
  type MockRepository,
} from '../common/helpers/mock-repository.helper';

const mockTeam = { id: 'team-uuid-001', name: 'Team Alpha' };

const mockProject: Project = {
  id: 'project-uuid-001',
  name: 'TaskFlow v1',
  description: 'API principale',
  status: ProjectStatus.DRAFT,
  team: mockTeam as Project['team'],
  tasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repo: MockRepository<Project>;
  let findOneTeamMock: jest.Mock;

  beforeEach(async () => {
    repo = createMockRepository<Project>();
    findOneTeamMock = jest.fn().mockResolvedValue(mockTeam);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: repo },
        { provide: TeamsService, useValue: { findOne: findOneTeamMock } },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('retourne la liste des projets avec leur equipe', async () => {
      repo.find.mockResolvedValue([mockProject]);

      const result = await service.findAll();

      expect(result).toEqual([mockProject]);
      expect(repo.find).toHaveBeenCalledWith({ relations: ['team'] });
    });

    it('retourne un tableau vide si aucun projet', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('retourne le projet avec team et tasks', async () => {
      repo.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(mockProject.id);

      expect(result).toEqual(mockProject);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        relations: ['team', 'tasks'],
      });
    });

    it('leve NotFoundException si le projet est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Nouveau projet',
      teamId: 'team-uuid-001',
    };

    it('cree et retourne le projet avec l equipe resolue', async () => {
      repo.create.mockReturnValue(mockProject);
      repo.save.mockResolvedValue(mockProject);

      const result = await service.create(dto);

      expect(findOneTeamMock).toHaveBeenCalledWith(dto.teamId);
      expect(result).toEqual(mockProject);
    });

    it('leve NotFoundException si l equipe n existe pas', async () => {
      findOneTeamMock.mockRejectedValue(
        new NotFoundException('Team not found'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('met a jour le nom du projet', async () => {
      const updated = { ...mockProject, name: 'Nom modifie' };
      repo.findOne.mockResolvedValue({ ...mockProject });
      repo.save.mockResolvedValue(updated);

      const result = await service.update(mockProject.id, {
        name: 'Nom modifie',
      });

      expect(result.name).toBe('Nom modifie');
    });

    it('met a jour l equipe si teamId est fourni', async () => {
      const newTeam = { id: 'team-uuid-002', name: 'Team Beta' };
      findOneTeamMock.mockResolvedValue(newTeam);
      repo.findOne.mockResolvedValue({ ...mockProject });
      repo.save.mockResolvedValue({
        ...mockProject,
        team: newTeam as Project['team'],
      });

      await service.update(mockProject.id, { teamId: 'team-uuid-002' });

      expect(findOneTeamMock).toHaveBeenCalledWith('team-uuid-002');
    });

    it('leve NotFoundException si le projet est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime le projet existant', async () => {
      repo.findOne.mockResolvedValue(mockProject);
      repo.remove.mockResolvedValue(mockProject);

      await expect(service.remove(mockProject.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockProject);
    });

    it('leve NotFoundException si le projet est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
