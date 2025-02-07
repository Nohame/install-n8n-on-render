FROM n8nio/n8n:latest

# Installer LibreOffice
RUN apt update && apt install -y libreoffice