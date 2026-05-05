import {
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../enums';

export class CreateTaskDto {
  @ApiProperty({
    example: "Implémenter l'authentification JWT",
    description: 'Titre de la tâche',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'Mettre en place Passport.js avec stratégie JWT',
    description: 'Description détaillée de la tâche',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.TODO,
    description: 'Statut de la tâche',
  })
  @IsEnum(TaskStatus, {
    message: `Le statut doit être l'un de : ${Object.values(TaskStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    description: 'Priorité de la tâche',
  })
  @IsEnum(TaskPriority, {
    message: `La priorité doit être l'une de : ${Object.values(TaskPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID du projet associé',
    format: 'uuid',
  })
  @IsUUID('4')
  projectId!: string;

  @ApiPropertyOptional({
    example: '58779cc2-d7d6-463e-8fed-95f0ef5c4094',
    description: "UUID de l'utilisateur assigné (null pour désassigner)",
    format: 'uuid',
    nullable: true,
  })
  @ValidateIf((o: CreateTaskDto) => o.assigneeId !== null)
  @IsUUID('4')
  @IsOptional()
  assigneeId?: string | null;
}
