import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'alice@taskflow.dev',
    description: 'Adresse email unique',
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email!: string;

  @ApiProperty({
    example: 'Alice Dupont',
    description: 'Nom complet',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.MEMBER,
    description: "Rôle de l'utilisateur",
  })
  @IsEnum(UserRole, {
    message: `Le rôle doit être l'un de : ${Object.values(UserRole).join(', ')}`,
  })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: 'MotDePasse123',
    description: 'Mot de passe (min 8 caractères)',
    minLength: 8,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  password!: string;
}
