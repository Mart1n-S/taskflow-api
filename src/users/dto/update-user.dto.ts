// NOTE: Pour que Swagger affiche correctement les champs dans l'UI,
// il faudrait utiliser PartialType et OmitType de '@nestjs/swagger' plutôt
// que de '@nestjs/mapped-types'. Les versions de @nestjs/swagger transmettent
// les métadonnées Swagger (@ApiProperty) automatiquement via PartialType/OmitType.
// On garde @nestjs/mapped-types pour rester cohérent avec le cours.
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
