import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Creates a new task, resolving project and assignee relations from their IDs.
   */
  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      priority: dto.priority,
      project: { id: dto.projectId },
      assignee: dto.assigneeId ? { id: dto.assigneeId } : null,
    });
    return this.tasksRepository.save(task);
  }

  /**
   * Returns all tasks with their project and assignee relations.
   */
  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['project', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns a single task by ID.
   * @throws NotFoundException if the task does not exist
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['project', 'assignee'],
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  /**
   * Updates a task and emits a WebSocket notification if the assignee changes.
   * @throws NotFoundException if the task does not exist
   */
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const previousAssigneeId = task.assignee?.id;

    // Résoudre les relations depuis les IDs du DTO
    if (dto.projectId !== undefined) {
      task.project = { id: dto.projectId } as Task['project'];
    }
    if (dto.assigneeId !== undefined) {
      task.assignee = dto.assigneeId
        ? ({ id: dto.assigneeId } as Task['assignee'])
        : null;
    }

    Object.assign(task, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
    });

    const updated = await this.tasksRepository.save(task);

    // Notifier le nouvel assigné si l'assigné a changé
    if (dto.assigneeId && dto.assigneeId !== previousAssigneeId) {
      this.notificationsGateway.sendToUser(dto.assigneeId, 'task:assigned', {
        taskId: updated.id,
        taskTitle: updated.title,
        message: `Vous avez été assigné à : "${updated.title}"`,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(
        `Notification task:assigned envoyée → user:${dto.assigneeId}`,
      );
    }

    return updated;
  }

  /**
   * Deletes a task by ID.
   * @throws NotFoundException if the task does not exist
   */
  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
