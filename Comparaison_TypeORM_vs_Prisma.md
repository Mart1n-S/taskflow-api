# TP16 - Comparaison TypeORM vs Prisma

## Observations pratiques

### 1. Concision du code : `select` intégré vs `{ select: false }`

**TypeORM** déclare `select: false` directement sur la colonne de l'entité :

```typescript
@Column({ name: 'password_hash', select: false })
passwordHash: string;
```

Cette annotation est globale - TypeORM l'applique automatiquement à toutes les
requêtes `find*`. En revanche, `save()` retourne l'objet en mémoire avec le hash
inclus, ce qui oblige à le supprimer manuellement :

```typescript
delete (saved as Partial<User>).passwordHash;
```

**Prisma** n'a pas d'équivalent à `select: false` dans le schéma. Chaque requête
retourne tous les champs par défaut. La solution propre est un objet `select`
centralisé réutilisé dans toutes les méthodes :

```typescript
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Utilisé dans chaque requête
return this.prisma.user.findMany({ select: USER_SELECT });
```

L'avantage de l'approche Prisma est qu'elle est **explicite** - on sait exactement
quels champs sont retournés sans avoir à connaître les annotations de l'entité.
Depuis Prisma v5.13, il existe aussi un `omit` global au niveau du `PrismaClient`
qui reproduit le comportement de `select: false` :

```typescript
const prisma = new PrismaClient({
  omit: { user: { passwordHash: true } },
});
```

---

### 2. Relations : `include` vs `{ relations: [...] }`

**TypeORM** charge les relations via le tableau `relations` :

```typescript
const team = await this.teamsRepository.findOne({
  where: { id },
  relations: ['members', 'projects'],
});
```

Les relations sont des chaînes de caractères - aucune vérification TypeScript à
la compilation. Une faute de frappe (`'member'` au lieu de `'members'`) ne génère
pas d'erreur à la compilation.

**Prisma** utilise `include` avec un objet typé :

```typescript
const team = await this.prisma.team.findUnique({
  where: { id },
  include: {
    members: true,
    projects: {
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

L'autocomplétion TypeScript fonctionne parfaitement - si la relation n'existe pas
dans le schéma, TypeScript signale une erreur à la compilation. On peut aussi
filtrer, trier et paginer les relations directement dans `include`, ce qui est
impossible avec TypeORM sans passer par un `QueryBuilder`.

---

### 3. Absence de `@InjectRepository` et `Repository<T>`

**TypeORM** nécessite d'injecter un `Repository<T>` pour chaque entité :

```typescript
constructor(
  @InjectRepository(User)
  private readonly usersRepository: Repository<User>,
) {}
```

Cela implique d'importer `TypeOrmModule.forFeature([User])` dans chaque module
qui a besoin de l'entité, ce qui alourdit la configuration des modules.

**Prisma** expose toutes les tables via un seul service global `PrismaService`
marqué `@Global()` - une seule injection suffit pour accéder à toutes les entités :

```typescript
constructor(private readonly prisma: PrismaService) {}

// Accès à n'importe quelle table sans configuration supplémentaire
this.prisma.user.findMany();
this.prisma.team.findUnique({ where: { id } });
this.prisma.project.create({ data: {...} });
```

Aucun `forFeature()` dans les modules - `PrismaModule` est importé une seule fois
dans `AppModule` et disponible partout.

---

## Bilan : avantages et inconvénients

### TypeORM

**Avantages**
- Paradigme orienté objet familier - les entités sont des classes TypeScript décorées
- `select: false` global sur une colonne évite les oublis d'exclusion
- Plus flexible pour les requêtes complexes via `QueryBuilder`
- Migrations gérées en TypeScript, proches du code applicatif
- Écosystème mature avec NestJS, très bien documenté

**Inconvénients**
- Relations déclarées en chaînes de caractères - pas de vérification à la compilation
- `save()` retourne l'objet en mémoire avec tous les champs - nécessite un nettoyage manuel
- Configuration verbeuse : `@InjectRepository`, `forFeature()` dans chaque module
- La synchronisation entre entités et schéma peut diverger sans `synchronize: true`
- Types moins précis - le retour de `findOne` peut être `User | null` ou `User` selon la méthode

### Prisma

**Avantages**
- Types générés automatiquement depuis le schéma - autocomplétion parfaite partout
- `include` et `select` entièrement typés - les erreurs sont détectées à la compilation
- Un seul `PrismaService` global pour toutes les tables - configuration minimale
- `prisma migrate dev` génère le SQL et le client en une commande
- `prisma studio` offre une interface visuelle pour explorer les données
- Les relations imbriquées avec filtres/tri sont expressives et concises

**Inconvénients**
- Pas de `select: false` natif sur un champ - nécessite un objet `select` partagé ou `omit` global
- Schéma `.prisma` séparé du code TypeScript - deux sources de vérité à maintenir
- Moins flexible pour les requêtes SQL très complexes (bien que `$queryRaw` existe)
- Prisma v7 nécessite un `adapter` explicite pour la connexion - configuration plus complexe
- L'approche est plus opinionée - moins de liberté sur la structure du code

---

## Conclusion

TypeORM et Prisma répondent au même besoin mais avec des philosophies différentes.
TypeORM privilégie la flexibilité et le paradigme orienté objet, ce qui le rend
naturel dans un projet NestJS avec des entités complexes. Prisma privilégie la
sécurité des types et la DX (Developer Experience), avec une génération automatique
de types qui élimine une classe entière d'erreurs runtime. Pour un nouveau projet,
Prisma est aujourd'hui le choix dominant - pour un projet existant avec des entités
TypeORM bien structurées, la migration n'est pas toujours justifiée.