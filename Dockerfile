FROM n8nio/n8n:latest

# Définir le dossier de travail pour les nœuds personnalisés
WORKDIR /data/custom-nodes

# Copier les nœuds personnalisés dans l’image Docker
COPY ./custom-nodes/ /data/custom-nodes/

# Passer en mode root pour installer les dépendances système et Python
USER root

# Installer les dépendances système requises
RUN apk add --no-cache \
    libreoffice \
    openjdk17 \
    pandoc \
    python3 \
    py3-pip \
    gcc \
    g++ \
    musl-dev \
    make \
    && rm -rf /var/cache/apk/*

# Définir un store unique pour pnpm dans Docker
RUN pnpm config set store-dir /data/custom-nodes/.pnpm-store

# Vérifier et installer pnpm si nécessaire
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer TypeScript pour éviter l'erreur "tsc: not found"
RUN pnpm add -D typescript

# Installer Python et outils nécessaires
RUN apk add --no-cache python3 py3-pip py3-virtualenv

# Créer un environnement virtuel dans /opt/venv
RUN python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir transformers pillow \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && deactivate

# Installer les dépendances des nœuds personnalisés avec pnpm
WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --frozen-lockfile && pnpm run build

# Définir où n8n doit chercher les extensions personnalisées
ENV N8N_CUSTOM_EXTENSIONS="/data/custom-nodes/"

# Nettoyage des fichiers inutiles pour réduire la taille de l'image Docker
RUN rm -rf /root/.cache/pnpm /data/custom-nodes/.pnpm-store

# Revenir à l’utilisateur par défaut de n8n
USER node
