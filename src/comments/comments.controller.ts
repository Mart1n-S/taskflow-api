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
} from '@nestjs/common';
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
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les commentaires' })
  @ApiOkResponse({ description: 'Liste des commentaires' })
  findAll() {
    return this.commentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un commentaire par ID' })
  @ApiOkResponse({ description: 'Commentaire trouvé' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un commentaire' })
  @ApiOkResponse({ description: 'Commentaire mis à jour' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(+id, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiNoContentResponse({ description: 'Commentaire supprimé' })
  @ApiNotFoundResponse({ description: 'Commentaire introuvable' })
  remove(@Param('id') id: string) {
    return this.commentsService.remove(+id);
  }
}
