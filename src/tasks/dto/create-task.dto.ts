import {
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../enums';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus, {
    message: `Le statut doit être l'un de : ${Object.values(TaskStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority, {
    message: `La priorité doit être l'une de : ${Object.values(TaskPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID('4')
  projectId: string;

  @IsUUID('4')
  @IsOptional()
  assigneeId?: string;
}
