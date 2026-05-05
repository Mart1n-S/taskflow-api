import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus, TaskPriority } from './enums';
import type { Task } from './entities/task.entity';

const mockTask: Task = {
  id: 'task-uuid-001',
  title: 'Implémenter JWT',
  description: null,
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  project: { id: 'project-uuid-001' } as Task['project'],
  assignee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TasksController', () => {
  let controller: TasksController;
  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findOneMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(mockTask);
    findAllMock = jest.fn().mockResolvedValue([mockTask]);
    findOneMock = jest.fn().mockResolvedValue(mockTask);
    updateMock = jest.fn().mockResolvedValue(mockTask);
    removeMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
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

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create et retourne la tache creee', async () => {
      const dto = { title: 'Nouvelle tâche', projectId: 'project-uuid-001' };

      const result = await controller.create(dto);

      expect(createMock).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('retourne la liste des taches', async () => {
      const result = await controller.findAll();

      expect(findAllMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTask]);
    });
  });

  describe('findOne', () => {
    it('retourne la tache correspondante a l id', async () => {
      const result = await controller.findOne(mockTask.id);

      expect(findOneMock).toHaveBeenCalledWith(mockTask.id);
      expect(result).toEqual(mockTask);
    });

    it('propage NotFoundException si la tache est introuvable', async () => {
      findOneMock.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id et dto', async () => {
      const dto = { title: 'Titre modifie' };

      const result = await controller.update(mockTask.id, dto);

      expect(updateMock).toHaveBeenCalledWith(mockTask.id, dto);
      expect(result).toEqual(mockTask);
    });

    it('propage NotFoundException si la tache est introuvable', async () => {
      updateMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockTask.id);

      expect(removeMock).toHaveBeenCalledWith(mockTask.id);
    });

    it('propage NotFoundException si la tache est introuvable', async () => {
      removeMock.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
