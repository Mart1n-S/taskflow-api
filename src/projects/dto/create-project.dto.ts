import {
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../enums/project-status.enum';

export class CreateProjectDto {
  @ApiProperty({
    example: 'TaskFlow v1',
    description: 'Nom du projet',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'API principale de gestion de tâches',
    description: 'Description du projet',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    description: 'Statut du projet',
  })
  @IsEnum(ProjectStatus, {
    message: `Le statut doit être l'un de : ${Object.values(ProjectStatus).join(', ')}`,
  })
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: "UUID de l'équipe associée",
    format: 'uuid',
  })
  @IsUUID('4')
  teamId!: string;
}
