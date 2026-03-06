import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProjectStatus } from '../../projects/enums/project-status.enum';
import { TaskStatus } from '../../tasks/enums/task-status.enum';
import { TaskPriority } from '../../tasks/enums/task-priority.enum';
import * as bcrypt from 'bcrypt';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  // ── 1. Vider les tables dans le bon ordre (FK) ──────────────────────────
  await AppDataSource.query('TRUNCATE TABLE comments CASCADE');
  await AppDataSource.query('TRUNCATE TABLE tasks CASCADE');
  await AppDataSource.query('TRUNCATE TABLE projects CASCADE');
  await AppDataSource.query('TRUNCATE TABLE team_members CASCADE');
  await AppDataSource.query('TRUNCATE TABLE teams CASCADE');
  await AppDataSource.query('TRUNCATE TABLE users CASCADE');
  console.log('🗑️  Tables vidées');

  // ── 2. Repositories ──────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User);
  const teamRepo = AppDataSource.getRepository(Team);
  const projectRepo = AppDataSource.getRepository(Project);
  const taskRepo = AppDataSource.getRepository(Task);
  const commentRepo = AppDataSource.getRepository(Comment);

  // ── 3. Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await userRepo.save(
    userRepo.create({
      email: 'alice@taskflow.dev',
      name: 'Alice Dupont',
      role: UserRole.ADMIN,
      passwordHash,
    }),
  );

  const bob = await userRepo.save(
    userRepo.create({
      email: 'bob@taskflow.dev',
      name: 'Bob Martin',
      role: UserRole.MEMBER,
      passwordHash,
    }),
  );

  const charlie = await userRepo.save(
    userRepo.create({
      email: 'charlie@taskflow.dev',
      name: 'Charlie Bernard',
      role: UserRole.VIEWER,
      passwordHash,
    }),
  );
  console.log('👤 3 utilisateurs créés');

  // ── 4. Teams ─────────────────────────────────────────────────────────────
  const alpha = await teamRepo.save(
    teamRepo.create({
      name: 'Équipe Alpha',
      description: 'Équipe principale de développement',
      members: [alice, bob],
    }),
  );

  await teamRepo.save(
    teamRepo.create({
      name: 'Équipe Beta',
      description: 'Équipe secondaire',
      members: [charlie],
    }),
  );
  console.log('👥 2 équipes créées');

  // ── 5. Projects ───────────────────────────────────────────────────────────
  const projectTaskflow = await projectRepo.save(
    projectRepo.create({
      name: 'TaskFlow v1',
      description: 'API principale TaskFlow',
      status: ProjectStatus.ACTIVE,
      team: alpha,
    }),
  );

  await projectRepo.save(
    projectRepo.create({
      name: 'Documentation',
      description: 'Documentation technique',
      status: ProjectStatus.DRAFT,
      team: alpha,
    }),
  );
  console.log('📁 2 projets créés');

  // ── 6. Tasks ──────────────────────────────────────────────────────────────
  const task1 = await taskRepo.save(
    taskRepo.create({
      title: 'Configurer NestJS',
      description: 'Initialiser le projet NestJS avec TypeORM',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      project: projectTaskflow,
      assignee: alice,
    }),
  );

  const task2 = await taskRepo.save(
    taskRepo.create({
      title: 'Implémenter les entités',
      description: 'Créer les entités TypeORM pour tous les domaines',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      project: projectTaskflow,
      assignee: bob,
    }),
  );

  await taskRepo.save(
    taskRepo.create({
      title: 'Écrire les tests',
      description: 'Tests unitaires et e2e',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      project: projectTaskflow,
      assignee: null,
    }),
  );
  console.log('✅ 3 tâches créées');

  // ── 7. Comments ───────────────────────────────────────────────────────────
  await commentRepo.save(
    commentRepo.create({
      content: 'Configuration terminée, tout fonctionne correctement.',
      author: alice,
      task: task1,
    }),
  );

  await commentRepo.save(
    commentRepo.create({
      content: 'En cours, les entités User et Team sont finalisées.',
      author: bob,
      task: task2,
    }),
  );
  console.log('💬 2 commentaires créés');

  // ── 8. Fermer la connexion ────────────────────────────────────────────────
  await AppDataSource.destroy();
  console.log('🎉 Seed terminé avec succès !');
}

seed().catch((error: unknown) => {
  console.error('❌ Erreur lors du seed :', error);
  process.exit(1);
});
