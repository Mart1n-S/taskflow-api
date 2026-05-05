/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
const SEED_CREDENTIALS = 'password123';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';
import { Team } from '../src/teams/entities/team.entity';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let memberToken: string;
  let teamId: string;
  let projectId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestUsers(dataSource);

    const teamRepo = dataSource.getRepository(Team);
    const team = await teamRepo.save(teamRepo.create({ name: 'Test Team' }));
    teamId = team.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: SEED_CREDENTIALS });
    adminToken = adminRes.body.access_token;

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: SEED_CREDENTIALS });
    memberToken = memberRes.body.access_token;

    const projectRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Projet de test', teamId });
    projectId = projectRes.body.id;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /api/projects', () => {
    it('200 + liste non vide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer()).get('/api/projects').expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('200 + projet trouve', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(projectId);
      expect(res.body.name).toBe('Projet de test');
    });

    it('404 si projet inexistant', () => {
      return request(app.getHttpServer())
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/projects', () => {
    it('201 + projet cree par admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nouveau projet', teamId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Nouveau projet');
    });

    it('201 + projet cree par member', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Projet member', teamId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('400 si nom manquant', () => {
      return request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamId })
        .expect(400);
    });

    it('400 si teamId manquant', () => {
      return request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Projet sans team' })
        .expect(400);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .post('/api/projects')
        .send({ name: 'Test', teamId })
        .expect(401);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('200 + nom mis a jour par admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nom modifie' })
        .expect(200);

      expect(res.body.name).toBe('Nom modifie');
    });

    it('200 + nom mis a jour par member', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Modifie par member' })
        .expect(200);

      expect(res.body.name).toBe('Modifie par member');
    });

    it('404 si projet inexistant', () => {
      return request(app.getHttpServer())
        .patch('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .patch(`/api/projects/${projectId}`)
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('204 + projet supprime par admin', async () => {
      await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('403 si member tente de supprimer', () => {
      return request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('404 si projet inexistant', () => {
      return request(app.getHttpServer())
        .delete('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .expect(401);
    });
  });
});
