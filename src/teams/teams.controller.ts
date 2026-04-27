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
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';

@ApiTags('teams')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une équipe' })
  @ApiCreatedResponse({ description: 'Équipe créée avec succès' })
  @ApiConflictResponse({ description: "Nom d'équipe déjà utilisé" })
  create(@Body() createTeamDto: CreateTeamDto): Promise<Team> {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les équipes avec leurs membres' })
  @ApiOkResponse({ description: 'Liste des équipes' })
  findAll(): Promise<Team[]> {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une équipe par ID' })
  @ApiOkResponse({ description: 'Équipe trouvée avec membres et projets' })
  @ApiNotFoundResponse({ description: 'Équipe introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Team> {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une équipe' })
  @ApiOkResponse({ description: 'Équipe mise à jour' })
  @ApiNotFoundResponse({ description: 'Équipe introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<Team> {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une équipe' })
  @ApiNoContentResponse({ description: 'Équipe supprimée' })
  @ApiNotFoundResponse({ description: 'Équipe introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teamsService.remove(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter un membre à une équipe' })
  @ApiOkResponse({ description: 'Membre ajouté' })
  @ApiNotFoundResponse({ description: 'Équipe ou utilisateur introuvable' })
  @ApiConflictResponse({ description: 'Utilisateur déjà membre' })
  addMember(
    @Param('id', ParseUUIDPipe) teamId: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ): Promise<Team> {
    return this.teamsService.addMember(teamId, userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retirer un membre d'une équipe" })
  @ApiOkResponse({ description: 'Membre retiré' })
  @ApiNotFoundResponse({ description: 'Équipe ou utilisateur introuvable' })
  removeMember(
    @Param('id', ParseUUIDPipe) teamId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Team> {
    return this.teamsService.removeMember(teamId, userId);
  }
}
