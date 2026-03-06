import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { TeamsService } from '../teams/teams.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly teamsService: TeamsService,
  ) {}

  /**
   * Find all projects with their team
   * @returns An array of projects
   */
  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ['team'],
    });
  }

  /**
   * Find a project by ID
   * @param id The ID of the project
   * @returns The project with team and tasks
   * @throws NotFoundException if the project is not found
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['team', 'tasks'],
    });
    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }
    return project;
  }

  /**
   * Create a new project
   * @param dto The data transfer object containing the project information
   * @returns The created project
   * @throws NotFoundException if the team is not found
   */
  async create(dto: CreateProjectDto): Promise<Project> {
    const team = await this.teamsService.findOne(dto.teamId);
    const project = this.projectsRepository.create({
      name: dto.name,
      description: dto.description,
      status: dto.status,
      team,
    });
    return this.projectsRepository.save(project);
  }

  /**
   * Update an existing project
   * @param id The ID of the project to update
   * @param dto The data transfer object containing the updated project information
   * @returns The updated project
   * @throws NotFoundException if the project or team is not found
   */
  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    if (dto.teamId) {
      project.team = await this.teamsService.findOne(dto.teamId);
    }
    Object.assign(project, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description && { description: dto.description }),
      ...(dto.status && { status: dto.status }),
    });
    return this.projectsRepository.save(project);
  }

  /**
   * Remove a project by ID
   * @param id The ID of the project to remove
   * @throws NotFoundException if the project is not found
   */
  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.remove(project);
  }
}
