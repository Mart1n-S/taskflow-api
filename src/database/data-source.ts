import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Charger le bon fichier .env selon NODE_ENV
// En CI, les variables sont déjà injectées — dotenv ne les écrase pas
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile, override: false });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'taskflow',
  username: process.env.DB_USER || 'taskflow',
  password: process.env.DB_PASSWORD || 'taskflow',

  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],

  synchronize: false,
  logging: true,
});
