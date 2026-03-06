import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { UsersService } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Find all teams with their members
   * @returns An array of teams with members loaded
   */
  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({
      relations: ['members'],
    });
  }

  /**
   * Find a team by ID with members and projects
   * @param id The ID of the team to find
   * @returns The team with members and projects loaded
   * @throws NotFoundException if the team is not found
   */
  async findOne(id: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'projects'],
    });
    if (!team) {
      throw new NotFoundException(`Team #${id} not found`);
    }
    return team;
  }

  /**
   * Create a new team
   * @param dto The data transfer object containing the team information
   * @returns The created team
   * @throws ConflictException if the team name is already taken
   */
  async create(dto: CreateTeamDto): Promise<Team> {
    try {
      const team = this.teamsRepository.create(dto);
      return await this.teamsRepository.save(team);
    } catch (error) {
      // Check for unique constraint violation (PostgreSQL error code 23505)
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code: string }).code === '23505'
      ) {
        throw new ConflictException(`Team name "${dto.name}" is already taken`);
      }
      throw error;
    }
  }

  /**
   * Update an existing team
   * @param id The ID of the team to update
   * @param dto The data transfer object containing the updated team information
   * @returns The updated team
   * @throws NotFoundException if the team is not found
   */
  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findOne(id);
    Object.assign(team, dto);
    return this.teamsRepository.save(team);
  }

  /**
   * Remove a team by ID
   * @param id The ID of the team to remove
   * @throws NotFoundException if the team is not found
   */
  async remove(id: string): Promise<void> {
    const team = await this.findOne(id);
    await this.teamsRepository.remove(team);
  }

  /**
   * Add a member to a team
   * @param teamId The ID of the team
   * @param userId The ID of the user to add
   * @returns The updated team with members
   * @throws NotFoundException if the team or user is not found
   * @throws ConflictException if the user is already a member
   */
  async addMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.findOne(teamId);
    const user = await this.usersService.findOne(userId);
    const alreadyMember = team.members.some((m) => m.id === userId);
    if (alreadyMember) {
      throw new ConflictException(
        `User #${userId} is already a member of Team #${teamId}`,
      );
    }
    team.members.push(user);
    return this.teamsRepository.save(team);
  }

  /**
   * Remove a member from a team
   * @param teamId The ID of the team
   * @param userId The ID of the user to remove
   * @returns The updated team with members
   * @throws NotFoundException if the team or user is not found
   */
  async removeMember(teamId: string, userId: string): Promise<Team> {
    const team = await this.findOne(teamId);
    await this.usersService.findOne(userId);
    team.members = team.members.filter((m) => m.id !== userId);
    return this.teamsRepository.save(team);
  }
}
