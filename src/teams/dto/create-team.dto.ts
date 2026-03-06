import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
