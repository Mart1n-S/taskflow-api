import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../interfaces/user.interface';

export class CreateUserDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(100)
  name!: string;

  @IsEnum(UserRole, {
    message: `Le rôle doit être l'un de : ${Object.values(UserRole).join(', ')}`,
  })
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  password!: string;
}
