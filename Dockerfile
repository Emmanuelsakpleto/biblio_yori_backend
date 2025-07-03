# Dockerfile pour LECTURA Backend
FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S lectura && \
    adduser -S lectura -u 1001

# Copier le code source
COPY --chown=lectura:lectura . .

# Créer les répertoires nécessaires
RUN mkdir -p uploads/books uploads/users uploads/backups logs && \
    chown -R lectura:lectura uploads logs

# Exposer le port
EXPOSE 5000

# Passer à l'utilisateur non-root
USER lectura

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "src/server.js"]