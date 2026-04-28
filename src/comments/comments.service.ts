import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  /**
   * Creates a new comment, resolving task and author relations from their IDs.
   */
  async create(dto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentsRepository.create({
      content: dto.content,
      task: { id: dto.taskId },
      author: { id: dto.authorId },
    });
    const saved = await this.commentsRepository.save(comment);
    this.logger.log(`Commentaire créé : ${saved.id}`);
    return saved;
  }

  /**
   * Returns all comments with their task and author relations.
   */
  async findAll(): Promise<Comment[]> {
    return this.commentsRepository.find({
      relations: ['task', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns a single comment by ID.
   * @throws NotFoundException if the comment does not exist
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['task', 'author'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return comment;
  }

  /**
   * Updates a comment's content.
   * @throws NotFoundException if the comment does not exist
   */
  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    Object.assign(comment, dto);
    return this.commentsRepository.save(comment);
  }

  /**
   * Deletes a comment by ID.
   * @throws NotFoundException if the comment does not exist
   */
  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentsRepository.remove(comment);
  }
}
