/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';

const SEED_CREDENTIALS = 'password123';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  /**
   * Creates the app once for all tests in this suite.
   * beforeAll is used here because app creation is expensive.
   */
  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  /**
   * Before each test: clean the DB and reseed with fresh data.
   * Ensures each test starts from a known, consistent state.
   */
  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestUsers(dataSource);
  });

  /**
   * After all tests: close DB connection and app to avoid open handles.
   */
  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('200 + token avec les bons credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: SEED_CREDENTIALS })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.user.email).toBe('admin@test.com');
      accessToken = res.body.access_token;
    });

    it('401 avec mauvais mot de passe', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong' })
        .expect(401);
    });

    it('401 avec email inconnu', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: SEED_CREDENTIALS })
        .expect(401);
    });

    it('401 si le body est vide (AuthGuard court-circuite le DTO)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(401);
    });

    it('401 si le format email est invalide (AuthGuard court-circuite le DTO)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'pas-un-email', password: SEED_CREDENTIALS })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    /**
     * Before each test in this block: login to get a fresh token.
     * Needed because cleanDatabase runs before each test.
     */
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: SEED_CREDENTIALS });
      accessToken = res.body.access_token;
    });

    it('200 + profil connecté sans passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@test.com');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('401 sans token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('401 avec un token malformé', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token.invalide.ici')
        .expect(401);
    });
  });
});
