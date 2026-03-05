import {
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ProjectStatus } from '../interfaces/project.interface';

export class CreateProjectDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus, {
    message: `Le statut doit être l'un de : ${Object.values(ProjectStatus).join(', ')}`,
  })
  @IsOptional()
  status?: ProjectStatus;

  @IsUUID('4')
  teamId!: string;
}
