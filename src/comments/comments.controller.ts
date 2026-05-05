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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

@ApiTags('comments')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un commentaire' })
  @ApiCreatedResponse({ description: 'Commentaire créé avec succès' })
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentsService.create(createCommentDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les commentaires' })
  @ApiOkResponse({ description: 'Liste des commentaires' })
  findAll(): Promise<Comment[]> {
    return this.commentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un commentaire par ID' })
  @ApiOkResponse({ description: 'Commentaire trouvé' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Modifier le contenu d'un commentaire" })
  @ApiOkResponse({ description: 'Commentaire mis à jour' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiNoContentResponse({ description: 'Commentaire supprimé' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commentsService.remove(id);
  }
}
