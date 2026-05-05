jest.mock('bcrypt');
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import {
  createMockRepository,
  createMockQueryBuilder,
  type MockRepository,
} from '../common/helpers/mock-repository.helper';

describe('UsersService', () => {
  /**
   * The service under test - instantiated via NestJS TestingModule
   * to ensure the full dependency injection context is respected.
   */
  let service: UsersService;

  /**
   * Mocked TypeORM repository - replaces the real database repository
   * with Jest mock functions so tests run without a real DB connection.
   */
  let repo: MockRepository<User>;

  /**
   * Reusable mock user fixture used across all test cases.
   * Represents a fully populated User entity as it would come from the DB.
   * passwordHash is a fake bcrypt hash - never a real password.
   */
  const mockUser: User = {
    id: '11111111-0000-0000-0000-000000000001',
    email: 'alice@test.com',
    name: 'Alice',
    role: UserRole.ADMIN,
    passwordHash: '$2b$10$hash',
    teams: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  /**
   * Before each test:
   * - Creates a fresh mock repository to avoid state leaking between tests
   * - Builds a NestJS TestingModule with UsersService and the mock repository
   * - getRepositoryToken(User) is the DI token NestJS uses to inject Repository<User>
   *   We override it with our mock so UsersService never touches a real DB
   */
  beforeEach(async () => {
    repo = createMockRepository<User>();
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  /**
   * After each test:
   * - Clears all mock call history and return values
   * - Ensures no test pollutes the state of another
   */
  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it("retourne un tableau d'utilisateurs", async () => {
      repo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });

    it('retourne un tableau vide si aucun utilisateur', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it("retourne l'utilisateur quand il existe", async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it("lève NotFoundException quand l'utilisateur est introuvable", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      email: 'bob@test.com',
      name: 'Bob',
      password: 'secret123',
      role: UserRole.MEMBER,
    };

    it('crée et retourne un utilisateur', async () => {
      repo.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, email: dto.email, name: dto.name };
      repo.create.mockReturnValue(newUser as User);
      repo.save.mockResolvedValue(newUser as User);

      const result = await service.create(dto);

      expect(result).toEqual(newUser);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it("lève ConflictException si l'email existe déjà", async () => {
      repo.findOne.mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const adminPayload = {
      id: mockUser.id,
      email: mockUser.email,
      role: UserRole.ADMIN,
    };
    const memberPayload = {
      id: 'other-uuid',
      email: 'other@test.com',
      role: UserRole.MEMBER,
    };

    it('met a jour le profil (admin modifie son propre profil)', async () => {
      const updated = { ...mockUser, name: 'Alice Updated' };
      repo.findOne.mockResolvedValue(mockUser);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(
        mockUser.id,
        { name: 'Alice Updated' },
        adminPayload,
      );

      expect(result.name).toBe('Alice Updated');
    });

    it('leve ForbiddenException si member tente de modifier un autre profil', async () => {
      await expect(
        service.update(mockUser.id, { name: 'Test' }, memberPayload),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('leve ConflictException si le nouvel email est deja pris', async () => {
      const otherUser = {
        ...mockUser,
        id: 'other-uuid',
        email: 'taken@test.com',
      };
      repo.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(otherUser);

      await expect(
        service.update(mockUser.id, { email: 'taken@test.com' }, adminPayload),
      ).rejects.toThrow(ConflictException);
    });

    it('leve NotFoundException si l utilisateur est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { name: 'Test' }, adminPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('retourne le user avec passwordHash si l email existe', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(mockUser);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByEmailWithPassword(mockUser.email);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(qb.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
        email: mockUser.email,
      });
      expect(result).toEqual(mockUser);
    });

    it('retourne null si l email n existe pas', async () => {
      const qb = createMockQueryBuilder();
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByEmailWithPassword('nobody@test.com');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it("supprime l'utilisateur existant", async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.remove.mockResolvedValue(mockUser);

      await expect(service.remove(mockUser.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockUser);
    });

    it("lève NotFoundException si l'utilisateur n'existe pas", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
