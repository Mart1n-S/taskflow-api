import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private users: User[] = [];

  /**
   * Find all users
   * @returns An array of users
   */
  findAll(): User[] {
    return this.users;
  }

  /**
   * Find a user by ID
   * @param id The ID of the user to find
   * @returns The user with the given ID
   * @throws NotFoundException if the user is not found
   */
  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by email
   * @param email The email of the user to find
   * @returns The user with the given email or undefined if not found
   */
  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  /**
   * Create a new user
   * @param dto The data transfer object containing the user information
   * @returns The created user
   * @throws ConflictException if the email is already taken
   */
  create(dto: CreateUserDto): User {
    if (this.findByEmail(dto.email)) {
      throw new ConflictException(`Email ${dto.email} is already taken`);
    }
    const newUser: User = {
      id: randomUUID(),
      email: dto.email,
      name: dto.name,
      role: dto.role ?? UserRole.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  /**
   * Update an existing user
   * @param id The ID of the user to update
   * @param dto The data transfer object containing the updated user information
   * @returns The updated user
   * @throws NotFoundException if the user is not found with the method findOne
   * @throws ConflictException if the new email is already taken by another user
   */
  update(id: string, dto: UpdateUserDto): User {
    const user = this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      if (this.findByEmail(dto.email)) {
        throw new ConflictException(`Email ${dto.email} is already taken`);
      }
    }
    Object.assign(user, dto, { updatedAt: new Date() });
    return user;
  }

  /**
   * Remove a user by ID
   * @param id The ID of the user to remove
   * @throws NotFoundException if the user is not found
   */
  remove(id: string): void {
    this.findOne(id);
    this.users = this.users.filter((u) => u.id !== id);
  }
}
