# n8n Docker Setup with Custom DOCX Node

Ce dépôt sert principalement à lancer **n8n en local avec Docker Compose**, avec une image personnalisée qui embarque le nœud privé `Nhm DOCX To Text`.

## Contenu du dépôt

- Une stack locale `n8n + postgres` via `docker-compose.yml`
- Une stack de production `queue mode + redis + postgres` derrière un reverse proxy hôte (ex: nginx) via `docker-compose.prod.yml`
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
./docker.sh start --prod
./docker.sh stop --prod
./docker.sh restart --prod
./docker.sh update --prod
./docker.sh ssh --prod
```

Le script vérifie que toutes les variables présentes dans `.env.sample` existent aussi dans `.env` avant de lancer Docker.

## Production

Le fichier `docker-compose.prod.yml` est une base de production mono-hôte plus robuste, pensée pour absorber la charge en **queue mode** :

- `n8n-main` sert l'UI et les API
- `n8n-webhook` absorbe les requêtes webhook
- `n8n-worker` exécute les jobs en arrière-plan
- `redis` sert de broker de queue
- `postgres` persiste les données n8n
- le TLS et le reverse proxy sont gérés par l'hôte (par exemple nginx)

### Préparation

1. Copier l'environnement de prod :

```sh
cp .env.prod.sample .env.prod
```

2. Renseigner au minimum dans `.env.prod` :

- les domaines `N8N_EDITOR_HOST` et `N8N_WEBHOOK_HOST`
- `N8N_ENCRYPTION_KEY`
- `N8N_RUNNERS_AUTH_TOKEN`
- les mots de passe Postgres, Redis et Basic Auth

3. Pointer DNS vers le serveur :

- `N8N_EDITOR_HOST` pour l'interface n8n
- `N8N_WEBHOOK_HOST` pour les webhooks

### Démarrage

```sh
./docker.sh start --prod
```

En prod, les services HTTP sont exposés uniquement en local sur l'hôte :

- `127.0.0.1:5678` → interface / API `n8n-main`
- `127.0.0.1:5679` → service `n8n-webhook`

Le reverse proxy hôte (par exemple nginx) doit ensuite router :

- `N8N_EDITOR_HOST` vers `http://127.0.0.1:5678`
- `N8N_WEBHOOK_HOST` vers `http://127.0.0.1:5679`

### Montée en charge

Le scale horizontal simple se fait d'abord sur les **webhook processors** :

```sh
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --scale n8n-webhook=2
```

Le `main` n'est pas prévu pour être scalé dans cette stack OSS. Il reste volontairement hors du pool webhook pour ne pas dégrader l'UI.

Pour les **workers**, la contrainte officielle n8n est plus forte : en queue mode, chaque worker a besoin de son propre sidecar `n8nio/runners` en mode externe. En pratique, avec un simple Docker Compose, il faut dupliquer des paires `worker + runners` supplémentaires ou passer à un orchestrateur si tu veux scaler proprement ce niveau.

### Notes d'exploitation

- La stack prod suppose deux sous-domaines distincts : un pour l'éditeur, un pour les webhooks. Cela simplifie le routage et évite d'envoyer le trafic webhook vers le `main`.
- Le reverse proxy hôte doit transmettre correctement les en-têtes `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, ainsi que `Upgrade` / `Connection` pour le websocket.
- Le mode binaire par défaut est réglé sur `database` pour rester compatible avec le queue mode. Si tu manipules beaucoup de fichiers volumineux, passe ensuite sur un stockage externe type S3.
- Les workers utilisent des task runners **externes**. Cela évite le warning Python et suit la recommandation n8n pour la prod.
- Cette stack reste une base **mono-machine**. Pour de la vraie haute disponibilité infra, il faut externaliser Postgres/Redis et passer sur un orchestrateur.

## Versions par défaut

La version n8n par défaut du dépôt est `2.11.4`.

Elle est alignée entre :

- `.env.sample`
- `.env.prod.sample`
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.prod.yml`

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
