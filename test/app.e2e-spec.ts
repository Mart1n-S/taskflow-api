/* eslint-disable @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';

describe('App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestUsers(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /api/', () => {
    it('200 + informations de l API', async () => {
      const res = await request(app.getHttpServer()).get('/api/').expect(200);

      expect(res.body).toMatchObject({
        message: 'TaskFlow API',
        version: '1.0.0',
      });
    });
  });

  describe('GET /api/health', () => {
    it('200 + status ok avec database up', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body).toMatchObject({
        status: 'ok',
        info: { database: { status: 'up' } },
      });
    });

    it('pas d enveloppe data/statusCode/timestamp (SkipTransform actif)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body).not.toHaveProperty('data');
      expect(res.body).not.toHaveProperty('statusCode');
    });

    it('accessible sans token (route @Public)', async () => {
      await request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });
});
