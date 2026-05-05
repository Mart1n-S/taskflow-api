import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from './enums/project-status.enum';
import type { Project } from './entities/project.entity';

const mockProject: Project = {
  id: 'project-uuid-001',
  name: 'TaskFlow v1',
  description: 'API principale',
  status: ProjectStatus.DRAFT,
  team: { id: 'team-uuid-001' } as Project['team'],
  tasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findOneMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(mockProject);
    findAllMock = jest.fn().mockResolvedValue([mockProject]);
    findOneMock = jest.fn().mockResolvedValue(mockProject);
    updateMock = jest.fn().mockResolvedValue(mockProject);
    removeMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
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

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create et retourne le projet cree', async () => {
      const dto = { name: 'Nouveau projet', teamId: 'team-uuid-001' };

      const result = await controller.create(dto);

      expect(createMock).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('retourne la liste des projets', async () => {
      const result = await controller.findAll();

      expect(findAllMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockProject]);
    });
  });

  describe('findOne', () => {
    it('retourne le projet correspondant a l id', async () => {
      const result = await controller.findOne(mockProject.id);

      expect(findOneMock).toHaveBeenCalledWith(mockProject.id);
      expect(result).toEqual(mockProject);
    });

    it('propage NotFoundException si le projet est introuvable', async () => {
      findOneMock.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id et dto', async () => {
      const dto = { name: 'Nom modifie' };

      const result = await controller.update(mockProject.id, dto);

      expect(updateMock).toHaveBeenCalledWith(mockProject.id, dto);
      expect(result).toEqual(mockProject);
    });

    it('propage NotFoundException si le projet est introuvable', async () => {
      updateMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockProject.id);

      expect(removeMock).toHaveBeenCalledWith(mockProject.id);
    });

    it('propage NotFoundException si le projet est introuvable', async () => {
      removeMock.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
