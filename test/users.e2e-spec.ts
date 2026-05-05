/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
const SEED_CREDENTIALS = 'password123';
const NEW_USER_CRED = 'Password123';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let memberToken: string;

  /**
   * Creates the app once for all tests in this suite.
   */
  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  /**
   * Before each test: clean DB, reseed, and login both users to get fresh tokens.
   * Tokens must be refreshed because cleanDatabase deletes all users.
   */
  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestUsers(dataSource);

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: SEED_CREDENTIALS });
    adminToken = adminRes.body.access_token;

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: SEED_CREDENTIALS });
    memberToken = memberRes.body.access_token;
  });

  /**
   * After all tests: close DB connection and app.
   */
  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('GET /api/users → 200 + liste non vide', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/users → 401 sans token', () => {
    return request(app.getHttpServer()).get('/api/users').expect(401);
  });

  it('POST /api/users → 201 par admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com', name: 'Nouveau', password: NEW_USER_CRED })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('new@test.com');
    // passwordHash ne doit jamais apparaître dans la réponse (select: false)
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('POST /api/users → 400 email invalide', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'pas-un-email', name: 'Test', password: NEW_USER_CRED })
      .expect(400);
  });

  it('POST /api/users → 403 par member (non admin)', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'new@test.com', name: 'Nouveau', password: NEW_USER_CRED })
      .expect(403);
  });

  it('Cycle complet : créer → récupérer → supprimer', async () => {
    // 1. Créer l'utilisateur
    const createRes = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'cycle@test.com',
        name: 'Cycle Test',
        password: NEW_USER_CRED,
      })
      .expect(201);

    const userId: string = createRes.body.id;
    expect(userId).toBeDefined();

    // 2. Récupérer l'utilisateur créé
    await request(app.getHttpServer())
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // 3. Supprimer l'utilisateur
    await request(app.getHttpServer())
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    // 4. Vérifier que l'utilisateur n'existe plus
    await request(app.getHttpServer())
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
