import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Find all users
   * @returns An array of users
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Find a user by ID
   * @param id The ID of the user to find
   * @returns The user with the given ID
   * @throws NotFoundException if the user is not found
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by email
   * @param email The email of the user to find
   * @returns The user with the given email or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Create a new user
   * @param dto The data transfer object containing the user information
   * @returns The created user
   * @throws ConflictException if the email is already taken
   */
  async create(dto: CreateUserDto): Promise<User> {
    if (await this.findByEmail(dto.email)) {
      throw new ConflictException(`Email ${dto.email} is already taken`);
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash,
    });
    return this.usersRepository.save(user);
  }

  /**
   * Update an existing user
   * @param id The ID of the user to update
   * @param dto The data transfer object containing the updated user information
   * @returns The updated user
   * @throws NotFoundException if the user is not found
   * @throws ConflictException if the new email is already taken by another user
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      if (await this.findByEmail(dto.email)) {
        throw new ConflictException(`Email ${dto.email} is already taken`);
      }
    }
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  /**
   * Remove a user by ID
   * @param id The ID of the user to remove
   * @returns void
   * @throws NotFoundException if the user is not found
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  /**
   * Find a user by email with password hash
   * @param email The email of the user to find
   * @returns The user with passwordHash or null if not found
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }
}
