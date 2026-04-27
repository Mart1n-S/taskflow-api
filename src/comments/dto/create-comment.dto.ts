import { IsString, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Bien penser à gérer les tokens expirés.',
    description: 'Contenu du commentaire',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  content!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de la tâche associée',
    format: 'uuid',
  })
  @IsUUID('4')
  taskId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: "UUID de l'auteur du commentaire",
    format: 'uuid',
  })
  @IsUUID('4')
  authorId!: string;
}
