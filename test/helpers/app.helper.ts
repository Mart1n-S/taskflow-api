import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

/**
 * Creates and initializes a NestJS test application with the same
 * configuration as the production app (prefix, pipes, filters).
 * @returns The app instance and TypeORM DataSource for DB operations
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

/**
 * Truncates all tables in the correct FK order to avoid constraint errors.
 * Must be called before each test to ensure a clean state.
 * @param dataSource The TypeORM DataSource connected to the test DB
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE TABLE team_members CASCADE');
  await dataSource.query('TRUNCATE TABLE comments CASCADE');
  await dataSource.query('TRUNCATE TABLE tasks CASCADE');
  await dataSource.query('TRUNCATE TABLE projects CASCADE');
  await dataSource.query('TRUNCATE TABLE teams CASCADE');
  await dataSource.query('TRUNCATE TABLE users CASCADE');
}
