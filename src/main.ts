import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'node:path';

async function bootstrap() {
  // NestExpressApplication requis pour useStaticAssets (fichiers HTML de test)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip les propriétés non décorées
      forbidNonWhitelisted: true, // erreur si propriété inconnue
      transform: true, // convertit automatiquement les types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(), // TODO: désactiver si les tests e2e (S14) échouent (.body.data au lieu de .body)
  );

  // Servir les fichiers statiques depuis /public (ex: test-ws.html)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TaskFlow API')
      .setDescription('API RESTful de gestion de projets et tâches')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via POST /api/auth/login',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentification')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('teams', 'Gestion des équipes')
      .addTag('projects', 'Gestion des projets')
      .addTag('tasks', 'Gestion des tâches')
      .addTag('comments', 'Commentaires')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
