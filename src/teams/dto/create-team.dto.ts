import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Équipe Alpha',
    description: "Nom unique de l'équipe",
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Équipe principale de développement',
    description: "Description de l'équipe",
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
