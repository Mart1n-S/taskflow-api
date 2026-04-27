import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO used exclusively for Swagger UI documentation.
 * No class-validator decorators needed here — Passport handles
 * validation itself via LocalStrategy.
 * This DTO only describes the request body shape in the Swagger UI.
 */
export class LoginDto {
  @ApiProperty({
    example: 'alice@taskflow.dev',
    description: 'Adresse email',
  })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mot de passe',
    writeOnly: true,
  })
  password!: string;
}
