# n8n Docker Setup with Custom DOCX Node

Ce dépôt sert principalement à lancer **n8n en local avec Docker Compose**, avec une image personnalisée qui embarque le nœud privé `Nhm DOCX To Text`.

## Contenu du dépôt

- Une stack locale `n8n + postgres` via `docker-compose.yml`
- Une image custom buildée depuis `Dockerfile`
- Un script d'exploitation `./docker.sh`
- Un custom node n8n dans `custom-nodes/nhm-docx-to-text`
- Un fichier `render.yaml` conservé pour un déploiement Render si besoin

## Démarrage local

1. Copier l'exemple d'environnement :

```sh
cp .env.sample .env
```

2. Ajuster au besoin les identifiants et URLs dans `.env`

3. Construire et démarrer la stack :

```sh
./docker.sh start
```

L'interface n8n est ensuite disponible sur `http://localhost:5678`.

## Commandes utiles

```sh
./docker.sh start
./docker.sh stop
./docker.sh restart
./docker.sh update
./docker.sh ssh
```

Le script vérifie que toutes les variables présentes dans `.env.sample` existent aussi dans `.env` avant de lancer Docker.

## Versions par défaut

La version n8n par défaut du dépôt est `2.11.4`.

Elle est alignée entre :

- `.env.sample`
- `Dockerfile`
- `docker-compose.yml`

La version PostgreSQL par défaut est `16.8-alpine`.

## Custom node inclus

Le package `custom-nodes/nhm-docx-to-text` ajoute le nœud `Nhm DOCX To Text`, qui lit un fichier DOCX depuis un champ binaire n8n et renvoie le texte extrait dans `json.text`.

Toute modification de ce package est prise en compte après reconstruction de l'image :

```sh
./docker.sh restart
```

## Déploiement Render

Le dépôt contient encore [render.yaml](render.yaml) pour un déploiement sur Render, mais la documentation et le workflow principal sont maintenant centrés sur l'exécution locale Docker.

## Références

- n8n : https://n8n.io
- Documentation n8n : https://docs.n8n.io
- Communauté n8n : https://community.n8n.io
- Render : https://render.com
