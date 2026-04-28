# Étape 1 : Builder
# Image complète avec devDependencies pour compiler TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les manifestes de dépendances en premier (cache Docker optimisé)
# Si package.json ne change pas, cette couche est réutilisée depuis le cache
COPY package*.json ./
RUN npm ci

# Copier les sources et compiler
COPY . .
RUN npm run build

# Étape 2 : Runner
# Image légère - uniquement les dépendances de production + le dist compilé
FROM node:20-alpine AS runner
WORKDIR /app

# Seulement les prod dependencies - pas de devDependencies dans l'image finale
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier uniquement le code compilé depuis le builder
COPY --from=builder /app/dist ./dist

# Sécurité : utilisateur non-root pour éviter les escalades de privilèges
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production
EXPOSE 3000

# Health check intégré à Docker - vérifie que l'API répond
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main.js"]