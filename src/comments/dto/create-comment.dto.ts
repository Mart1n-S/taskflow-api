import { IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsUUID('4')
  taskId: string;

  @IsUUID('4')
  authorId: string;
}
