import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
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
import { UsersPrismaService } from './users-prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@ApiTags('users-prisma')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('users-prisma')
export class UsersPrismaController {
  constructor(private readonly usersPrismaService: UsersPrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Prisma)' })
  @ApiOkResponse({ description: 'Liste des utilisateurs' })
  findAll() {
    return this.usersPrismaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (Prisma)' })
  @ApiOkResponse({ description: 'Utilisateur trouvé' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersPrismaService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un utilisateur (ADMIN uniquement) (Prisma)' })
  @ApiCreatedResponse({ description: 'Utilisateur créé avec succès' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins' })
  create(@Body() dto: CreateUserDto) {
    return this.usersPrismaService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur (Prisma)' })
  @ApiOkResponse({ description: 'Utilisateur mis à jour' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @ApiForbiddenResponse({ description: 'Modification interdite' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersPrismaService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un utilisateur (ADMIN uniquement) (Prisma)',
  })
  @ApiNoContentResponse({ description: 'Utilisateur supprimé' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersPrismaService.remove(id);
  }
}
