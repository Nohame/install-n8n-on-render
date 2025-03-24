FROM n8nio/n8n:latest

# Définir le dossier de travail pour les nœuds personnalisés
WORKDIR /data/custom-nodes

# Copier les nœuds dans l’image Docker
COPY ./custom-nodes/ /data/custom-nodes/

# Passer en mode root pour installer les dépendances système
USER root

# Installer LibreOffice, OpenJDK 17 et Pandoc
RUN apk add --no-cache libreoffice openjdk17 pandoc \
    && rm -rf /var/cache/apk/*

# Définir un store unique pour pnpm dans Docker
RUN pnpm config set store-dir /data/custom-nodes/.pnpm-store

# Installer TypeScript pour éviter l'erreur "tsc: not found"
RUN pnpm add -D typescript

# Installer crypto
RUN pnpm add crypto

# Installer les dépendances du nœud personnalisé avec pnpm
WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --frozen-lockfile && pnpm run build

# Définir où n8n doit chercher les extensions
ENV N8N_CUSTOM_EXTENSIONS="/data/custom-nodes/"

# Revenir à l’utilisateur par défaut de n8n
USER node
