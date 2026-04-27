import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un utilisateur (ADMIN uniquement)' })
  @ApiCreatedResponse({ description: 'Utilisateur créé avec succès' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs' })
  @ApiOkResponse({ description: 'Liste des utilisateurs' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiOkResponse({ description: 'Utilisateur trouvé' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur (ADMIN ou soi-même)' })
  @ApiOkResponse({ description: 'Utilisateur mis à jour' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @ApiForbiddenResponse({
    description: "Modification du profil d'un autre utilisateur interdite",
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur (ADMIN uniquement)' })
  @ApiNoContentResponse({ description: 'Utilisateur supprimé' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
