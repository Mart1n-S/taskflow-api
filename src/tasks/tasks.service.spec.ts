import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  createMockRepository,
  type MockRepository,
} from '../common/helpers/mock-repository.helper';
import { TaskStatus, TaskPriority } from './enums';

/**
 * Mock for NotificationsGateway — we only need sendToUser for these tests.
 */
const createMockGateway = () => ({
  sendToUser: jest.fn(),
  sendToProject: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repo: MockRepository<Task>;
  let gateway: ReturnType<typeof createMockGateway>;

  /**
   * Reusable mock task fixture.
   */
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

  const mockTaskWithAssignee: Task = {
    ...mockTask,
    assignee: { id: 'user-uuid-001' } as Task['assignee'],
  };

  beforeEach(async () => {
    repo = createMockRepository<Task>();
    gateway = createMockGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('retourne un tableau de tâches', async () => {
      repo.find.mockResolvedValue([mockTask]);

      const result = await service.findAll();

      expect(result).toEqual([mockTask]);
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith({
        relations: ['project', 'assignee'],
        order: { createdAt: 'DESC' },
      });
    });

    it('retourne un tableau vide si aucune tâche', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('retourne la tâche quand elle existe', async () => {
      repo.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockTask.id },
        relations: ['project', 'assignee'],
      });
    });

    it('lève NotFoundException si la tâche est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      title: 'Nouvelle tâche',
      projectId: 'project-uuid-001',
    };

    it('crée et retourne une tâche', async () => {
      repo.create.mockReturnValue(mockTask);
      repo.save.mockResolvedValue(mockTask);

      const result = await service.create(dto);

      expect(result).toEqual(mockTask);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('crée une tâche avec un assigné', async () => {
      const dtoWithAssignee = { ...dto, assigneeId: 'user-uuid-001' };
      repo.create.mockReturnValue(mockTaskWithAssignee);
      repo.save.mockResolvedValue(mockTaskWithAssignee);

      const result = await service.create(dtoWithAssignee);

      expect(result.assignee).toBeDefined();
    });
  });

  describe('update', () => {
    it("met à jour le titre sans notifier si l'assigné ne change pas", async () => {
      repo.findOne.mockResolvedValue({ ...mockTask });
      repo.save.mockResolvedValue({ ...mockTask, title: 'Titre modifié' });

      await service.update(mockTask.id, { title: 'Titre modifié' });

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(gateway.sendToUser).not.toHaveBeenCalled();
    });

    it("émet task:assigned quand l'assigné change", async () => {
      repo.findOne.mockResolvedValue({ ...mockTask, assignee: null });
      const updatedTask = {
        ...mockTask,
        assignee: { id: 'user-uuid-002' } as Task['assignee'],
      };
      repo.save.mockResolvedValue(updatedTask);

      await service.update(mockTask.id, { assigneeId: 'user-uuid-002' });

      expect(gateway.sendToUser).toHaveBeenCalledWith(
        'user-uuid-002',
        'task:assigned',
        expect.objectContaining({
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          message: expect.stringContaining(updatedTask.title) as string,
          timestamp: expect.any(String) as string,
        }),
      );
    });

    it("ne notifie pas si l'assigné est le même", async () => {
      repo.findOne.mockResolvedValue({ ...mockTaskWithAssignee });
      repo.save.mockResolvedValue(mockTaskWithAssignee);

      await service.update(mockTask.id, { assigneeId: 'user-uuid-001' });

      expect(gateway.sendToUser).not.toHaveBeenCalled();
    });

    it('met à jour le status de la tache', async () => {
      repo.findOne.mockResolvedValue({ ...mockTask });
      repo.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.update(mockTask.id, {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(gateway.sendToUser).not.toHaveBeenCalled();
    });

    it('retire l assignee si assigneeId est null', async () => {
      repo.findOne.mockResolvedValue({ ...mockTaskWithAssignee });
      repo.save.mockResolvedValue({ ...mockTask, assignee: null });

      const result = await service.update(mockTask.id, { assigneeId: null });

      expect(result.assignee).toBeNull();
      expect(gateway.sendToUser).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si la tâche est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime la tâche existante', async () => {
      repo.findOne.mockResolvedValue(mockTask);
      repo.remove.mockResolvedValue(mockTask);

      await expect(service.remove(mockTask.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockTask);
    });

    it('lève NotFoundException si la tâche est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
