/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
const SEED_CREDENTIALS = 'password123';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';
import { Team } from '../src/teams/entities/team.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Comment } from '../src/comments/entities/comment.entity';
import { TaskStatus, TaskPriority } from '../src/tasks/enums';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminId: string;
  let taskId: string;
  let commentId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    const { admin } = await seedTestUsers(dataSource);
    adminId = admin.id;

    const teamRepo = dataSource.getRepository(Team);
    const team = await teamRepo.save(teamRepo.create({ name: 'Test Team' }));

    const projectRepo = dataSource.getRepository(Project);
    const project = await projectRepo.save(
      projectRepo.create({ name: 'Test Project', team }),
    );

    const taskRepo = dataSource.getRepository(Task);
    const task = await taskRepo.save(
      taskRepo.create({
        title: 'Tâche de test',
        project,
        assignee: null,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      }),
    );
    taskId = task.id;

    const commentRepo = dataSource.getRepository(Comment);
    const comment = await commentRepo.save(
      commentRepo.create({
        content: 'Commentaire de test',
        task,
        author: admin,
      }),
    );
    commentId = comment.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: SEED_CREDENTIALS });
    adminToken = adminRes.body.access_token;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  // ─────────────────────────────────────────────
  // GET /api/comments
  // ─────────────────────────────────────────────

  describe('GET /api/comments', () => {
    it('200 + liste non vide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer()).get('/api/comments').expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/comments/:id
  // ─────────────────────────────────────────────

  describe('GET /api/comments/:id', () => {
    it('200 + commentaire trouvé', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(commentId);
      expect(res.body.content).toBe('Commentaire de test');
    });

    it('404 si commentaire inexistant', () => {
      return request(app.getHttpServer())
        .get('/api/comments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/comments
  // ─────────────────────────────────────────────

  describe('POST /api/comments', () => {
    it('201 + commentaire créé', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Nouveau commentaire',
          taskId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Nouveau commentaire');
    });

    it('400 si contenu manquant', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ taskId })
        .expect(400);
    });

    it('201 + auteur dans la reponse est l utilisateur connecte', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Commentaire auteur', taskId })
        .expect(201);

      expect(res.body.author.id).toBe(adminId);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .send({ content: 'Test', taskId })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // PATCH /api/comments/:id
  // ─────────────────────────────────────────────

  describe('PATCH /api/comments/:id', () => {
    it('200 + contenu mis à jour', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Contenu modifié' })
        .expect(200);

      expect(res.body.content).toBe('Contenu modifié');
    });

    it('404 si commentaire inexistant', () => {
      return request(app.getHttpServer())
        .patch('/api/comments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Test' })
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .patch(`/api/comments/${commentId}`)
        .send({ content: 'Test' })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /api/comments/:id
  // ─────────────────────────────────────────────

  describe('DELETE /api/comments/:id', () => {
    it('204 + commentaire supprimé', async () => {
      await request(app.getHttpServer())
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('404 si commentaire inexistant', () => {
      return request(app.getHttpServer())
        .delete('/api/comments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .delete(`/api/comments/${commentId}`)
        .expect(401);
    });
  });
});
