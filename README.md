<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest


# TaskFlow API

API RESTful de gestion de projets et tâches, construite avec NestJS dans le cadre du cours ESGI 5IW.

---

## Principe

TaskFlow permet à des équipes de gérer des projets, des tâches et des commentaires avec un système de rôles (admin / member / viewer). L'API inclut une authentification JWT, des notifications temps réel via WebSockets lorsqu'une tâche est assignée, et un pipeline CI/CD complet.

---

## Stack technique

| Couche           | Technologie                                    |
| ---------------- | ---------------------------------------------- |
| Runtime          | Node.js 20 + TypeScript strict                 |
| Framework        | NestJS 11                                      |
| Base de données  | PostgreSQL 16 via TypeORM                      |
| Authentification | JWT + Passport.js (stratégies `local` + `jwt`) |
| WebSockets       | Socket.IO (`@nestjs/websockets`)               |
| Documentation    | Swagger / OpenAPI (`@nestjs/swagger`)          |
| Sécurité         | Helmet, RBAC, `JwtAuthGuard` global            |
| Tests            | Jest (unitaires) + Supertest (e2e)             |
| CI/CD            | GitHub Actions                                 |
| Conteneurisation | Docker multi-stage + docker-compose            |

---

## Architecture

```
src/
├── auth/            # JWT, LocalStrategy, JwtAuthGuard, RolesGuard, décorateurs
├── users/           # CRUD utilisateurs, ownership check
├── teams/           # Gestion des équipes (ManyToMany avec users)
├── projects/        # Gestion des projets (liés à une équipe)
├── tasks/           # Gestion des tâches + notification WS à l'assigné
├── comments/        # Commentaires sur les tâches
├── notifications/   # WebSocket gateway Socket.IO (/notifications)
├── health/          # Health check TypeORM via @nestjs/terminus
├── common/          # GlobalExceptionFilter, LoggingInterceptor, TransformInterceptor
└── database/        # Migrations TypeORM, seeds
```

---

## Prérequis

- Node.js >= 20
- Docker + Docker Compose

---

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone <repo>
cd taskflow-api
npm install
```

### 2. Configurer les variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```bash
cp .env.example .env
```

Valeurs par défaut pour le développement :

```env
# Environment variables for TaskFlow API
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=taskflow
DB_USER=taskflow
DB_PASSWORD=taskflow

# pgAdmin configuration
PGADMIN_EMAIL=
PGADMIN_PASSWORD=
PGADMIN_PORT=8080

# JWT configuration
JWT_SECRET=taskflow-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

> ⚠️ Ne jamais committer `.env` ni `.env.production` - ces fichiers sont dans `.gitignore`.


Pour le JWT_SECRET, générer la clé secrète sécurisée en utilisant la commande suivante dans votre terminal :

```bash
openssl rand -base64 62
```

### 3. Lancer PostgreSQL (dev)

```bash
docker compose up -d
```

Cela démarre PostgreSQL sur le port **5433** (pour éviter un conflit avec un PostgreSQL local sur 5432) et pgAdmin sur le port **8080**.

### 4. Lancer les migrations

```bash
npm run migration:run
```

### 5. Seeder la base (optionnel)

```bash
npm run seed
```

Crée les données de développement :

| Email                | Mot de passe | Rôle   |
| -------------------- | ------------ | ------ |
| alice@taskflow.dev   | password123  | admin  |
| bob@taskflow.dev     | password123  | member |
| charlie@taskflow.dev | password123  | viewer |

### 6. Démarrer le serveur

```bash
npm run start:dev
```

L'API écoute sur **http://localhost:3000/api**.

---

## Documentation Swagger

Disponible uniquement en mode `development` :

**http://localhost:3000/docs**

Pour tester les endpoints protégés :
1. `POST /api/auth/login` avec `{ "email": "alice@taskflow.dev", "password": "password123" }`
2. Copier le `access_token`
3. Cliquer **Authorize** (cadenas) et coller le token

---

## Endpoints principaux

Tous les endpoints sont préfixés `/api`.

| Méthode                    | Route             | Accès                            |
| -------------------------- | ----------------- | -------------------------------- |
| `POST`                     | `/api/auth/login` | Public                           |
| `GET`                      | `/api/auth/me`    | Authentifié                      |
| `GET`                      | `/api/health`     | Public                           |
| `GET` / `POST`             | `/api/users`      | Authentifié / Admin              |
| `GET` / `PATCH` / `DELETE` | `/api/users/:id`  | Authentifié (ownership ou admin) |
| `GET` / `POST`             | `/api/teams`      | Authentifié                      |
| `GET` / `POST`             | `/api/projects`   | Authentifié                      |
| `GET` / `POST`             | `/api/tasks`      | Authentifié                      |
| `PATCH` / `DELETE`         | `/api/tasks/:id`  | Authentifié                      |
| `GET` / `POST`             | `/api/comments`   | Authentifié                      |

---

## Tests

### Unitaires

```bash
npm run test
npm run test:cov   # avec rapport de couverture
```

Couvre `UsersService`, `TasksService`, `CommentsService` et `RolesGuard` avec repositories mockés via `createMockRepository`.

### E2E

Créer la base de test si elle n'existe pas :

```bash
docker exec -it taskflow_postgres psql -U taskflow -d taskflow -c "CREATE DATABASE taskflow_test;"
```

Appliquer les migrations sur la base de test :

```bash
npm run migration:run:test
```

Lancer les tests e2e :

```bash
npm run test:e2e
```

Les tests utilisent `.env.test`, tournent en séquentiel (`--runInBand`) et la base est nettoyée avant chaque suite via `TRUNCATE ... CASCADE`.

Suites couvertes : **Auth**, **Users**, **Tasks**, **Comments**, **AppController** - 41 tests au total.

---

## WebSockets - Notifications temps réel

Le gateway Socket.IO écoute sur le namespace `/notifications`. Le client doit passer son JWT à la connexion :

```javascript
const socket = io('http://localhost:3000/notifications', {
  auth: { token: '<jwt>' }
});
```

| Événement       | Direction        | Description                              |
| --------------- | ---------------- | ---------------------------------------- |
| `join:project`  | client → serveur | Rejoindre la room d'un projet            |
| `task:assigned` | serveur → client | Notifié quand une tâche lui est assignée |

**Tester en temps réel** - ouvrir http://localhost:3000/test-ws.html dans deux onglets, connecter Alice (admin) et Bob (member), puis assigner une tâche à Bob via `PATCH /api/tasks/:id` avec `{ "assigneeId": "<bob_id>" }`.

---

## Déploiement Docker (production)

> ⚠️ Arrêter `npm run start:dev` avant de lancer le déploiement prod - les deux utilisent le port `3000`.

### 1. Créer `.env.production` (ne jamais committer)

```env
# Environment variables for TaskFlow API
NODE_ENV=production

# Database configuration
# DB_HOST doit être "postgres" (nom du service Docker) et non "localhost"
DB_HOST=postgres
DB_PORT=5432
DB_NAME=taskflow
DB_USER=taskflow_prod
DB_PASSWORD=<mot_de_passe_fort>

# JWT configuration
JWT_SECRET=<secret_aleatoire_min_64_chars>
JWT_EXPIRES_IN=8h
```

Pour générer un JWT_SECRET sécurisé :

```bash
openssl rand -base64 62
```

### 2. Lancer les containers

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

### 3. Appliquer les migrations

Les migrations doivent être lancées depuis le container `api` car PostgreSQL prod n'est pas exposé sur la machine :

```bash
docker exec -it taskflow_api node -e "
const { AppDataSource } = require('./dist/database/data-source');
AppDataSource.initialize().then(ds => ds.runMigrations()).then(() => { console.log('Migrations OK'); process.exit(0); });
"
```

### 4. Seeder la base (optionnel)

```bash
docker exec -it taskflow_api node -e "
const { AppDataSource } = require('./dist/database/data-source');
const bcrypt = require('bcrypt');
AppDataSource.initialize().then(async ds => {
  const hash = await bcrypt.hash('password123', 10);
  const users = [
    ['alice@taskflow.dev', 'Alice Dupont', 'admin'],
    ['bob@taskflow.dev', 'Bob Martin', 'member'],
    ['charlie@taskflow.dev', 'Charlie Bernard', 'viewer'],
  ];
  for (const [email, name, role] of users) {
    await ds.query(
      \`INSERT INTO users (email, name, role, password_hash) VALUES ('\${email}', '\${name}', '\${role}', '\${hash}') ON CONFLICT DO NOTHING\`
    );
  }
  console.log('Seed OK');
  process.exit(0);
});
"
```

### 5. Vérifier la santé de l'API

```bash
curl http://localhost:3000/api/health
# {
#   "status": "ok",
#   "info": { "database": { "status": "up" } },
#   "error": {},
#   "details": { "database": { "status": "up" } }
# }
```

> Retourne `503 Service Unavailable` si la base de données est inaccessible.

Le Dockerfile est **multi-stage** :
- `builder` : compile TypeScript avec toutes les dépendances
- `runner` : image légère (~241 MB), prod dependencies uniquement, utilisateur non-root
---

## CI GitHub Actions

Le pipeline se déclenche sur push vers `main`/`develop` et sur les PR vers `main`.

- **Job Tests** : démarre PostgreSQL, installe les dépendances, lint ESLint, tests unitaires avec couverture, migrations, tests e2e
- **Job Build Docker** (push sur `main` uniquement) : build l'image multi-stage et vérifie sa taille

---

## Branche `feature/prisma` - Introduction à Prisma ORM

La branche `feature/prisma` introduit **Prisma v7** comme alternative à TypeORM, sans modifier le code de production existant.

```bash
git checkout feature/prisma
```

### Ce qui a été ajouté

- `prisma/schema.prisma` - schéma déclaratif avec les 5 modèles (User, Team, Project, Task, Comment)
- `prisma.config.ts` - configuration de la connexion Prisma v7 (datasource explicite)
- `src/prisma/` - `PrismaService` + `PrismaModule` (`@Global()`)
- `src/users/users-prisma.service.ts` - réécriture de `UsersService` avec Prisma Client
- `src/users/users-prisma.controller.ts` - routes dédiées sur `/api/users-prisma`

### Différences clés avec TypeORM

|                             | TypeORM                                | Prisma                                        |
| --------------------------- | -------------------------------------- | --------------------------------------------- |
| Exclusion de `passwordHash` | `select: false` sur la colonne         | `select: { passwordHash: false }` par requête |
| Relations                   | `{ relations: ['members'] }` (string)  | `include: { members: true }` (typé)           |
| Injection                   | `@InjectRepository(User)` par module   | `PrismaService` global unique                 |
| Migrations                  | `migration:generate` + `migration:run` | `npx prisma migrate dev`                      |

### Démarrage avec Prisma

```bash
# Créer la base dédiée
docker exec -it taskflow_postgres psql -U taskflow -d taskflow -c "CREATE DATABASE taskflow_prisma;"

# Ajouter dans .env
DATABASE_URL="postgresql://taskflow:taskflow@localhost:5433/taskflow_prisma?schema=public"

# Appliquer la migration Prisma
npx prisma migrate dev --name init-taskflow

# Explorer les données
npx prisma studio
```

---

## Commandes utiles

```bash
npm run start:dev            # Démarrage avec hot-reload
npm run build                # Compilation TypeScript
npm run migration:generate   # Générer une migration depuis les entités
npm run migration:run        # Appliquer les migrations (dev)
npm run migration:run:test   # Appliquer les migrations (test)
npm run migration:revert     # Annuler la dernière migration
npm run seed                 # Insérer les données de développement
npm run test                 # Tests unitaires
npm run test:e2e             # Tests e2e
npm run test:cov             # Couverture de tests
```
