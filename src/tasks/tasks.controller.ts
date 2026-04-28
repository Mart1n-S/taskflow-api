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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@ApiTags('tasks')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une tâche' })
  @ApiCreatedResponse({ description: 'Tâche créée avec succès' })
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les tâches' })
  @ApiOkResponse({ description: 'Liste des tâches' })
  findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par ID' })
  @ApiOkResponse({ description: 'Tâche trouvée' })
  @ApiNotFoundResponse({ description: 'Tâche introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une tâche' })
  @ApiOkResponse({ description: 'Tâche mise à jour' })
  @ApiNotFoundResponse({ description: 'Tâche introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiNoContentResponse({ description: 'Tâche supprimée' })
  @ApiNotFoundResponse({ description: 'Tâche introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
