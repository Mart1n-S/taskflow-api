/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
const SEED_CREDENTIALS = 'password123';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';

describe('Teams (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let memberId: string;
  let teamId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    const { member } = await seedTestUsers(dataSource);
    memberId = member.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: SEED_CREDENTIALS });
    adminToken = adminRes.body.access_token;

    const teamRes = await request(app.getHttpServer())
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Team' });
    teamId = teamRes.body.id;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /api/teams', () => {
    it('200 + liste non vide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer()).get('/api/teams').expect(401);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('200 + equipe trouvee avec membres et projets', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(teamId);
      expect(res.body.name).toBe('Test Team');
      expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('404 si equipe inexistante', () => {
      return request(app.getHttpServer())
        .get('/api/teams/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/teams', () => {
    it('201 + equipe creee', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nouvelle Equipe' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Nouvelle Equipe');
    });

    it('409 si le nom est deja utilise', () => {
      return request(app.getHttpServer())
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Team' })
        .expect(409);
    });

    it('400 si le nom est manquant', () => {
      return request(app.getHttpServer())
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .post('/api/teams')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /api/teams/:id', () => {
    it('200 + nom mis a jour', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nom modifie' })
        .expect(200);

      expect(res.body.name).toBe('Nom modifie');
    });

    it('404 si equipe inexistante', () => {
      return request(app.getHttpServer())
        .patch('/api/teams/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .patch(`/api/teams/${teamId}`)
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('204 + equipe supprimee', async () => {
      await request(app.getHttpServer())
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('404 si equipe inexistante', () => {
      return request(app.getHttpServer())
        .delete('/api/teams/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .delete(`/api/teams/${teamId}`)
        .expect(401);
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('200 + membre ajoute', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberId })
        .expect(200);

      const members = res.body.members as Array<{ id: string }>;
      expect(members.some((m) => m.id === memberId)).toBe(true);
    });

    it('409 si utilisateur deja membre', async () => {
      await request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberId });

      return request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberId })
        .expect(409);
    });

    it('404 si utilisateur inexistant', () => {
      return request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .send({ userId: memberId })
        .expect(401);
    });
  });

  describe('DELETE /api/teams/:id/members/:userId', () => {
    it('200 + membre retire', async () => {
      await request(app.getHttpServer())
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberId });

      const res = await request(app.getHttpServer())
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const members = res.body.members as Array<{ id: string }>;
      expect(members.every((m) => m.id !== memberId)).toBe(true);
    });

    it('401 sans token', () => {
      return request(app.getHttpServer())
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .expect(401);
    });
  });
});
