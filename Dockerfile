ARG N8N_VERSION=2.11.4
FROM n8nio/n8n:${N8N_VERSION}

USER root

ENV N8N_CUSTOM_EXTENSIONS=/data/custom-nodes

WORKDIR /data/custom-nodes

# Keep dependency installation cacheable when only node sources change.
COPY ./custom-nodes/nhm-docx-to-text/package.json /data/custom-nodes/nhm-docx-to-text/package.json
COPY ./custom-nodes/nhm-docx-to-text/pnpm-lock.yaml /data/custom-nodes/nhm-docx-to-text/pnpm-lock.yaml

RUN pnpm config set store-dir /data/custom-nodes/.pnpm-store

WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --frozen-lockfile

WORKDIR /data/custom-nodes
COPY ./custom-nodes/ /data/custom-nodes/

WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN pnpm run build

USER node
