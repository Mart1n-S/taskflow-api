import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Reusable select object that excludes passwordHash from all Prisma responses.
 * Unlike TypeORM's `select: false`, Prisma requires explicit field selection per query.
 */
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all users sorted by creation date (newest first).
   * passwordHash is excluded via select.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns a single user by ID.
   * @throws NotFoundException if the user does not exist
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  /**
   * Creates a new user after checking email uniqueness and hashing the password.
   * @throws ConflictException if the email is already taken
   */
  async create(dto: CreateUserDto) {
    // 1. Vérifier unicité email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already taken`);
    }

    // 2. Hacher le password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Créer l'utilisateur — select exclut passwordHash dès la création
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
      },
      select: USER_SELECT,
    });
  }

  /**
   * Updates an existing user's fields.
   * @throws NotFoundException if the user does not exist
   */
  async update(id: string, dto: UpdateUserDto) {
    // 1. Vérifier que l'user existe
    await this.findOne(id);

    // 2. Mettre à jour — select exclut passwordHash de la réponse
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  /**
   * Deletes a user by ID.
   * @throws NotFoundException if the user does not exist
   */
  async remove(id: string): Promise<void> {
    // 1. Vérifier que l'user existe
    await this.findOne(id);

    // 2. Supprimer
    await this.prisma.user.delete({ where: { id } });
  }
}
