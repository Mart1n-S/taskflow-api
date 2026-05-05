import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import {
  createMockRepository,
  type MockRepository,
} from '../common/helpers/mock-repository.helper';

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: MockRepository<Comment>;

  /**
   * Reusable mock comment fixture.
   */
  const mockComment: Comment = {
    id: 'comment-uuid-001',
    content: 'Super tâche !',
    author: { id: 'user-uuid-001' } as Comment['author'],
    task: { id: 'task-uuid-001' } as Comment['task'],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    repo = createMockRepository<Comment>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: repo },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('retourne un tableau de commentaires', async () => {
      repo.find.mockResolvedValue([mockComment]);

      const result = await service.findAll();

      expect(result).toEqual([mockComment]);
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith({
        relations: ['task', 'author'],
        order: { createdAt: 'DESC' },
      });
    });

    it('retourne un tableau vide si aucun commentaire', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('retourne le commentaire quand il existe', async () => {
      repo.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne(mockComment.id);

      expect(result).toEqual(mockComment);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockComment.id },
        relations: ['task', 'author'],
      });
    });

    it('lève NotFoundException si le commentaire est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      content: 'Nouveau commentaire',
      taskId: 'task-uuid-001',
    };
    const authorId = 'user-uuid-001';

    it('crée et retourne un commentaire', async () => {
      repo.create.mockReturnValue(mockComment);
      repo.save.mockResolvedValue(mockComment);

      const result = await service.create(dto, authorId);

      expect(result).toEqual(mockComment);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('appelle repo.create avec le bon authorId et taskId', async () => {
      repo.create.mockReturnValue(mockComment);
      repo.save.mockResolvedValue(mockComment);

      await service.create(dto, authorId);

      expect(repo.create).toHaveBeenCalledWith({
        content: dto.content,
        task: { id: dto.taskId },
        author: { id: authorId },
      });
    });
  });

  describe('update', () => {
    it('met à jour le contenu du commentaire', async () => {
      const updated = { ...mockComment, content: 'Contenu modifié' };
      repo.findOne.mockResolvedValue({ ...mockComment });
      repo.save.mockResolvedValue(updated);

      const result = await service.update(mockComment.id, {
        content: 'Contenu modifié',
      });

      expect(result.content).toBe('Contenu modifié');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('lève NotFoundException si le commentaire est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime le commentaire existant', async () => {
      repo.findOne.mockResolvedValue(mockComment);
      repo.remove.mockResolvedValue(mockComment);

      await expect(service.remove(mockComment.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockComment);
    });

    it('lève NotFoundException si le commentaire est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
