import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'node:path';
import helmet from 'helmet';

async function bootstrap() {
  // NestExpressApplication requis pour useStaticAssets (fichiers HTML de test)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Helmet en premier - sécurise les headers HTTP avant tout autre middleware
  if (process.env.NODE_ENV === 'production') {
    // En prod : CSP stricte
    app.use(helmet());
  } else {
    // En dev : CSP assouplie pour test-ws.html (CDN socket.io + inline scripts)
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io'],
            scriptSrcAttr: ["'unsafe-inline'"],
            connectSrc: ["'self'", 'ws:', 'wss:', 'cdn.socket.io', 'https:'],
          },
        },
      }),
    );
  }

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
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(reflector),
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
