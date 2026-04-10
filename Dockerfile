ARG N8N_VERSION=2.11.4
FROM n8nio/n8n:${N8N_VERSION}

USER root

ENV N8N_CUSTOM_EXTENSIONS=/data/custom-nodes

WORKDIR /data/custom-nodes

RUN pnpm config set store-dir /data/custom-nodes/.pnpm-store

# --- nhm-docx-to-text ---
COPY ./custom-nodes/nhm-docx-to-text/package.json /data/custom-nodes/nhm-docx-to-text/package.json
COPY ./custom-nodes/nhm-docx-to-text/pnpm-lock.yaml /data/custom-nodes/nhm-docx-to-text/pnpm-lock.yaml

WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --frozen-lockfile

# --- nhm-custom-chat-model ---
COPY ./custom-nodes/nhm-custom-chat-model/package.json /data/custom-nodes/nhm-custom-chat-model/package.json

WORKDIR /data/custom-nodes/nhm-custom-chat-model
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --no-frozen-lockfile --ignore-scripts

# --- Copy all sources & build ---
WORKDIR /data/custom-nodes
COPY ./custom-nodes/ /data/custom-nodes/

WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN pnpm run build

WORKDIR /data/custom-nodes/nhm-custom-chat-model
RUN pnpm run build

USER node
