/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UserRole } from '../users/enums/user-role.enum';
import type { User } from '../users/entities/user.entity';
import type { Comment } from './entities/comment.entity';

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

const mockComment: Comment = {
  id: 'comment-uuid-001',
  content: 'Super tâche !',
  author: { id: mockUser.id } as Comment['author'],
  task: { id: 'task-uuid-001' } as Comment['task'],
  createdAt: new Date(),
};

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: jest.Mocked<CommentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockComment),
            findAll: jest.fn().mockResolvedValue([mockComment]),
            findOne: jest.fn().mockResolvedValue(mockComment),
            update: jest.fn().mockResolvedValue(mockComment),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get(CommentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create avec le dto et user.id du token', async () => {
      const dto = { content: 'Nouveau commentaire', taskId: 'task-uuid-001' };

      const result = await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockComment);
    });
  });

  describe('findAll', () => {
    it('retourne la liste des commentaires', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockComment]);
    });
  });

  describe('findOne', () => {
    it('retourne le commentaire correspondant a l id', async () => {
      const result = await controller.findOne(mockComment.id);

      expect(service.findOne).toHaveBeenCalledWith(mockComment.id);
      expect(result).toEqual(mockComment);
    });

    it('propage NotFoundException si le service la leve', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id et dto', async () => {
      const dto = { content: 'Contenu modifié' };

      const result = await controller.update(mockComment.id, dto);

      expect(service.update).toHaveBeenCalledWith(mockComment.id, dto);
      expect(result).toEqual(mockComment);
    });

    it('propage NotFoundException si le service la leve', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockComment.id);

      expect(service.remove).toHaveBeenCalledWith(mockComment.id);
    });

    it('propage NotFoundException si le service la leve', async () => {
      service.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
