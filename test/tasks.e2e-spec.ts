/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';
import { Team } from '../src/teams/entities/team.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { TaskStatus, TaskPriority } from '../src/tasks/enums';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    // admin n'est pas utilisé — on ignore avec _
    const { member } = await seedTestUsers(dataSource);
    memberId = member.id;

    const teamRepo = dataSource.getRepository(Team);
    const team = await teamRepo.save(teamRepo.create({ name: 'Test Team' }));

    const projectRepo = dataSource.getRepository(Project);
    const project = await projectRepo.save(
      projectRepo.create({ name: 'Test Project', team }),
    );
    projectId = project.id;

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

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminRes.body.access_token;

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'password123' });
    memberToken = memberRes.body.access_token;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /api/tasks', () => {
    it('200 + liste non vide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer()).get('/api/tasks').expect(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('200 + tâche trouvée', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(taskId);
      expect(res.body.title).toBe('Tâche de test');
    });

    it('404 si tâche inexistante', () => {
      return request(app.getHttpServer())
        .get('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('201 + tâche créée', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Nouvelle tâche', projectId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Nouvelle tâche');
    });

    it('201 + tâche créée avec assigné', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Tâche assignée', projectId, assigneeId: memberId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('400 si titre manquant', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ projectId })
        .expect(400);
    });

    it('400 si projectId manquant', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Tâche sans projet' })
        .expect(400);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .send({ title: 'Test', projectId })
        .expect(401);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('200 + titre mis à jour', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Titre modifié' })
        .expect(200);

      expect(res.body.title).toBe('Titre modifié');
    });

    it('200 + status mis à jour (TODO -> IN_PROGRESS)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.status).toBe('in_progress');
    });

    it('200 + assigné mis à jour', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeId: memberId })
        .expect(200);

      expect(res.body).toHaveProperty('id');
    });

    it('404 si tâche inexistante', () => {
      return request(app.getHttpServer())
        .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('204 + tâche supprimée', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('404 si tâche inexistante', () => {
      return request(app.getHttpServer())
        .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('Cycle complet : créer → assigner → supprimer', () => {
    it("crée une tâche, l'assigne au member, puis la supprime", async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Cycle WS test', projectId })
        .expect(201);

      const newTaskId: string = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/tasks/${newTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeId: memberId })
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/tasks/${newTaskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/tasks/${newTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
