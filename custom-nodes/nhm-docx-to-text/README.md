# NHM DOCX To Text

This package contains the custom n8n node bundled into the Docker image built at the repository root. The node reads a DOCX file from an incoming binary field and returns the extracted raw text as `json.text`.

## Node behavior

- Node name: `Nhm DOCX To Text`
- Input: one binary property, default field name `data`
- Output: one JSON object per item with a `text` property
- Parser: [`mammoth`](https://www.npmjs.com/package/mammoth)

## Local development

From this directory:

```sh
pnpm install
pnpm validate
pnpm dev
```

`pnpm validate` runs the same checks as CI: TypeScript compilation plus ESLint on the node package.

## Repository integration

The root [Dockerfile](../../Dockerfile) installs this package, builds it, and exposes it to n8n through `N8N_CUSTOM_EXTENSIONS=/data/custom-nodes`. Any change here is picked up by rebuilding the root Docker image:

```sh
./docker.sh restart
```

## Scope

This package is intentionally private to the repository. It is maintained for the bundled Render and Docker deployment, not as a standalone npm package.
