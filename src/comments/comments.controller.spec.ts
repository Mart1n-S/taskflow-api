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
  let createMock: jest.Mock;
  let findAllMock: jest.Mock;
  let findOneMock: jest.Mock;
  let updateMock: jest.Mock;
  let removeMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(mockComment);
    findAllMock = jest.fn().mockResolvedValue([mockComment]);
    findOneMock = jest.fn().mockResolvedValue(mockComment);
    updateMock = jest.fn().mockResolvedValue(mockComment);
    removeMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
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

    controller = module.get<CommentsController>(CommentsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle service.create avec le dto et user.id du token', async () => {
      const dto = { content: 'Nouveau commentaire', taskId: 'task-uuid-001' };

      const result = await controller.create(dto, mockUser);

      expect(createMock).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockComment);
    });
  });

  describe('findAll', () => {
    it('retourne la liste des commentaires', async () => {
      const result = await controller.findAll();

      expect(findAllMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockComment]);
    });
  });

  describe('findOne', () => {
    it('retourne le commentaire correspondant a l id', async () => {
      const result = await controller.findOne(mockComment.id);

      expect(findOneMock).toHaveBeenCalledWith(mockComment.id);
      expect(result).toEqual(mockComment);
    });

    it('propage NotFoundException si le service la leve', async () => {
      findOneMock.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('appelle service.update avec id et dto', async () => {
      const dto = { content: 'Contenu modifié' };

      const result = await controller.update(mockComment.id, dto);

      expect(updateMock).toHaveBeenCalledWith(mockComment.id, dto);
      expect(result).toEqual(mockComment);
    });

    it('propage NotFoundException si le service la leve', async () => {
      updateMock.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('id-inexistant', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('appelle service.remove avec le bon id', async () => {
      await controller.remove(mockComment.id);

      expect(removeMock).toHaveBeenCalledWith(mockComment.id);
    });

    it('propage NotFoundException si le service la leve', async () => {
      removeMock.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
