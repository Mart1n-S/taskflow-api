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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un projet (ADMIN ou MEMBER)' })
  @ApiCreatedResponse({ description: 'Projet créé avec succès' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins et membres' })
  @ApiNotFoundResponse({ description: 'Équipe introuvable' })
  create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les projets' })
  @ApiOkResponse({ description: 'Liste des projets' })
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un projet par ID' })
  @ApiOkResponse({ description: 'Projet trouvé' })
  @ApiNotFoundResponse({ description: 'Projet introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Modifier un projet (ADMIN ou MEMBER)' })
  @ApiOkResponse({ description: 'Projet mis à jour' })
  @ApiNotFoundResponse({ description: 'Projet introuvable' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins et membres' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un projet (ADMIN uniquement)' })
  @ApiNoContentResponse({ description: 'Projet supprimé' })
  @ApiNotFoundResponse({ description: 'Projet introuvable' })
  @ApiForbiddenResponse({ description: 'Accès réservé aux admins' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}
