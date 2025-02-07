FROM n8nio/n8n:latest

# Passer en mode root pour installer les dependances
USER root

# Installer LibreOffice
RUN apk add --no-cache libreoffice

# Revenir à l’utilisateur par défaut de n8n
USER node