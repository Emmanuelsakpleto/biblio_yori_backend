# Dockerfile pour YORI Backend
FROM node:20-alpine3.19

# Mettre à jour les packages système et installer curl
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S yori && \
    adduser -S yori -u 1001

# Créer le répertoire de travail avec les bonnes permissions
WORKDIR /app
RUN chown yori:yori /app

# Changer vers l'utilisateur non-root avant les opérations
USER yori

# Copier les fichiers de dépendances
COPY --chown=yori:yori package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY --chown=yori:yori . .

# Exposer le port (ajustez selon votre application)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]