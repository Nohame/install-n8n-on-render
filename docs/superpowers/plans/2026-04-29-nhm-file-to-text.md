# nhm-file-to-text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le node n8n custom `nhm-file-to-text` qui détecte automatiquement le format d'un fichier binaire et extrait son texte (DOCX, PDF, ODT, TXT, CSV, HTML).

**Architecture:** Un module `parsers/` contient un fichier par format. Un `router.ts` mappe MIME type → parser avec fallback sur l'extension du fichier. Le node principal lit le champ binaire, appelle le router, et retourne `{ text, format, fileName }`.

**Tech Stack:** TypeScript, pnpm, n8n-workflow, mammoth, pdf-parse, adm-zip, xml2js, html-to-text, Jest + ts-jest

---

## File Map

| Fichier | Rôle |
|---------|------|
| `custom-nodes/nhm-file-to-text/package.json` | Dépendances et config n8n |
| `custom-nodes/nhm-file-to-text/tsconfig.json` | Compilation prod (nodes/) |
| `custom-nodes/nhm-file-to-text/tsconfig.test.json` | Compilation tests (nodes/ + tests/) |
| `custom-nodes/nhm-file-to-text/jest.config.js` | Config Jest |
| `custom-nodes/nhm-file-to-text/gulpfile.js` | Copie des icônes vers dist/ |
| `custom-nodes/nhm-file-to-text/.eslintrc.js` | Lint TypeScript |
| `custom-nodes/nhm-file-to-text/index.js` | Point d'entrée vide (requis n8n) |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/NhmFileToText.node.ts` | Node principal n8n |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/router.ts` | Détection format + dispatch |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/text.ts` | TXT et CSV |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/html.ts` | HTML |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/docx.ts` | DOCX via mammoth |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/pdf.ts` | PDF via pdf-parse |
| `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/odt.ts` | ODT via adm-zip + xml2js |
| `custom-nodes/nhm-file-to-text/tests/parsers/text.test.ts` | Tests parser text |
| `custom-nodes/nhm-file-to-text/tests/parsers/html.test.ts` | Tests parser html |
| `custom-nodes/nhm-file-to-text/tests/parsers/docx.test.ts` | Tests parser docx |
| `custom-nodes/nhm-file-to-text/tests/parsers/pdf.test.ts` | Tests parser pdf |
| `custom-nodes/nhm-file-to-text/tests/parsers/odt.test.ts` | Tests parser odt |
| `custom-nodes/nhm-file-to-text/tests/router.test.ts` | Tests router |
| `Dockerfile` | Ajout du nouveau node au build Docker |

---

## Task 1 : Scaffolding du projet

**Files:**
- Create: `custom-nodes/nhm-file-to-text/package.json`
- Create: `custom-nodes/nhm-file-to-text/tsconfig.json`
- Create: `custom-nodes/nhm-file-to-text/tsconfig.test.json`
- Create: `custom-nodes/nhm-file-to-text/jest.config.js`
- Create: `custom-nodes/nhm-file-to-text/gulpfile.js`
- Create: `custom-nodes/nhm-file-to-text/.eslintrc.js`
- Create: `custom-nodes/nhm-file-to-text/index.js`

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "n8n-nodes-nhm-file-to-text",
  "version": "0.1.0",
  "description": "Custom n8n node that extracts text from common file formats (DOCX, PDF, ODT, TXT, CSV, HTML).",
  "keywords": ["n8n-community-node-package"],
  "private": true,
  "license": "MIT",
  "author": { "name": "Nohame" },
  "repository": {
    "type": "git",
    "url": "https://github.com/Nohame/install-n8n-on-render.git"
  },
  "engines": { "node": ">=18.10", "pnpm": ">=9.1" },
  "packageManager": "pnpm@9.1.4",
  "main": "index.js",
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint nodes package.json",
    "lintfix": "eslint nodes package.json --fix"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": ["dist/nodes/NhmFileToText/NhmFileToText.node.js"]
  },
  "devDependencies": {
    "@types/adm-zip": "^0.5.5",
    "@types/jest": "^29.5.12",
    "@types/node": "^22.13.1",
    "@types/pdf-parse": "^1.1.4",
    "@types/xml2js": "^0.4.14",
    "@typescript-eslint/parser": "^7.15.0",
    "eslint": "^8.56.0",
    "eslint-plugin-n8n-nodes-base": "^1.16.1",
    "gulp": "^4.0.2",
    "jest": "^29.7.0",
    "prettier": "^3.3.2",
    "ts-jest": "^29.2.5",
    "typescript": "^5.5.3"
  },
  "peerDependencies": { "n8n-workflow": "*" },
  "dependencies": {
    "adm-zip": "^0.5.10",
    "html-to-text": "^9.0.5",
    "mammoth": "^1.9.0",
    "pdf-parse": "^1.1.1",
    "xml2js": "^0.6.2"
  }
}
```

- [ ] **Step 2: Créer `tsconfig.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2019",
    "lib": ["es2019", "es2020", "es2022.error"],
    "removeComments": true,
    "useUnknownInCatchVariables": false,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "strictNullChecks": true,
    "preserveConstEnums": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "outDir": "./dist/"
  },
  "include": ["nodes/**/*", "nodes/**/*.json", "package.json"]
}
```

- [ ] **Step 3: Créer `tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false
  },
  "include": ["nodes/**/*", "tests/**/*"]
}
```

- [ ] **Step 4: Créer `jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};
```

- [ ] **Step 5: Créer `gulpfile.js`**

```js
const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
  const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
  const nodeDestination = path.resolve('dist', 'nodes');
  src(nodeSource).pipe(dest(nodeDestination));
  const credSource = path.resolve('credentials', '**', '*.{png,svg}');
  const credDestination = path.resolve('dist', 'credentials');
  return src(credSource).pipe(dest(credDestination));
}
```

- [ ] **Step 6: Créer `.eslintrc.js`**

```js
module.exports = {
  root: true,
  env: { browser: true, es6: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    sourceType: 'module',
    extraFileExtensions: ['.json'],
  },
  ignorePatterns: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],
  overrides: [
    {
      files: ['package.json'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/community'],
      rules: {
        'n8n-nodes-base/community-package-json-name-still-default': 'off',
      },
    },
    {
      files: ['./nodes/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/nodes'],
      rules: {
        'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'off',
        'n8n-nodes-base/node-resource-description-filename-against-convention': 'off',
        'n8n-nodes-base/node-param-fixed-collection-type-unsorted-items': 'off',
      },
    },
  ],
};
```

- [ ] **Step 7: Créer `index.js` (vide)**

```js
```

- [ ] **Step 8: Installer les dépendances**

```bash
cd custom-nodes/nhm-file-to-text
pnpm install
```

Expected: résolution et installation sans erreur, création de `pnpm-lock.yaml`.

- [ ] **Step 9: Commit**

```bash
git add custom-nodes/nhm-file-to-text/
git commit -m "feat(nhm-file-to-text): scaffold project structure"
```

---

## Task 2 : Parser TXT/CSV

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/text.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/parsers/text.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/parsers/text.test.ts` :

```typescript
import { parseText } from '../../nodes/NhmFileToText/parsers/text';

describe('parseText', () => {
  it('extrait le texte depuis un buffer UTF-8', async () => {
    const buf = Buffer.from('Bonjour le monde', 'utf-8');
    const result = await parseText(buf);
    expect(result).toBe('Bonjour le monde');
  });

  it('gère un CSV multi-lignes', async () => {
    const csv = 'nom,age\nAlice,30\nBob,25';
    const buf = Buffer.from(csv, 'utf-8');
    const result = await parseText(buf);
    expect(result).toBe(csv);
  });

  it('retourne une chaîne vide pour un buffer vide', async () => {
    const result = await parseText(Buffer.alloc(0));
    expect(result).toBe('');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
cd custom-nodes/nhm-file-to-text
pnpm test -- tests/parsers/text.test.ts
```

Expected: FAIL — `Cannot find module '../../nodes/NhmFileToText/parsers/text'`

- [ ] **Step 3: Implémenter `parsers/text.ts`**

Créer `nodes/NhmFileToText/parsers/text.ts` :

```typescript
export async function parseText(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/parsers/text.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add nodes/NhmFileToText/parsers/text.ts tests/parsers/text.test.ts
git commit -m "feat(nhm-file-to-text): add text/csv parser"
```

---

## Task 3 : Parser HTML

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/html.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/parsers/html.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/parsers/html.test.ts` :

```typescript
import { parseHtml } from '../../nodes/NhmFileToText/parsers/html';

describe('parseHtml', () => {
  it('extrait le texte en supprimant les balises HTML', async () => {
    const html = '<html><body><h1>Titre</h1><p>Paragraphe.</p></body></html>';
    const buf = Buffer.from(html, 'utf-8');
    const result = await parseHtml(buf);
    expect(result).toContain('Titre');
    expect(result).toContain('Paragraphe.');
    expect(result).not.toContain('<h1>');
    expect(result).not.toContain('<p>');
  });

  it('gère un HTML vide', async () => {
    const buf = Buffer.from('', 'utf-8');
    const result = await parseHtml(buf);
    expect(result).toBe('');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
pnpm test -- tests/parsers/html.test.ts
```

Expected: FAIL — `Cannot find module '../../nodes/NhmFileToText/parsers/html'`

- [ ] **Step 3: Implémenter `parsers/html.ts`**

Créer `nodes/NhmFileToText/parsers/html.ts` :

```typescript
import { convert } from 'html-to-text';

export async function parseHtml(buffer: Buffer): Promise<string> {
  const html = buffer.toString('utf-8');
  if (!html.trim()) return '';
  return convert(html, { wordwrap: false });
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/parsers/html.test.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add nodes/NhmFileToText/parsers/html.ts tests/parsers/html.test.ts
git commit -m "feat(nhm-file-to-text): add HTML parser"
```

---

## Task 4 : Parser DOCX

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/docx.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/parsers/docx.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/parsers/docx.test.ts` :

```typescript
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: 'Contenu DOCX extrait' }),
}));

import { parseDocx } from '../../nodes/NhmFileToText/parsers/docx';
import * as mammoth from 'mammoth';

describe('parseDocx', () => {
  it('appelle mammoth.extractRawText et retourne le texte', async () => {
    const buf = Buffer.from('fake docx binary');
    const result = await parseDocx(buf);
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: buf });
    expect(result).toBe('Contenu DOCX extrait');
  });

  it('propage les erreurs de mammoth', async () => {
    (mammoth.extractRawText as jest.Mock).mockRejectedValueOnce(new Error('Fichier corrompu'));
    await expect(parseDocx(Buffer.from('bad'))).rejects.toThrow('Fichier corrompu');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
pnpm test -- tests/parsers/docx.test.ts
```

Expected: FAIL — `Cannot find module '../../nodes/NhmFileToText/parsers/docx'`

- [ ] **Step 3: Implémenter `parsers/docx.ts`**

Créer `nodes/NhmFileToText/parsers/docx.ts` :

```typescript
import * as mammoth from 'mammoth';

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/parsers/docx.test.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add nodes/NhmFileToText/parsers/docx.ts tests/parsers/docx.test.ts
git commit -m "feat(nhm-file-to-text): add DOCX parser"
```

---

## Task 5 : Parser PDF

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/pdf.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/parsers/pdf.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/parsers/pdf.test.ts` :

```typescript
jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({ text: 'Contenu PDF extrait' }),
);

import { parsePdf } from '../../nodes/NhmFileToText/parsers/pdf';
import pdfParse from 'pdf-parse';

describe('parsePdf', () => {
  it('appelle pdf-parse et retourne le texte', async () => {
    const buf = Buffer.from('fake pdf binary');
    const result = await parsePdf(buf);
    expect(pdfParse).toHaveBeenCalledWith(buf);
    expect(result).toBe('Contenu PDF extrait');
  });

  it('propage les erreurs de pdf-parse', async () => {
    (pdfParse as jest.Mock).mockRejectedValueOnce(new Error('PDF encrypté'));
    await expect(parsePdf(Buffer.from('bad'))).rejects.toThrow('PDF encrypté');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
pnpm test -- tests/parsers/pdf.test.ts
```

Expected: FAIL — `Cannot find module '../../nodes/NhmFileToText/parsers/pdf'`

- [ ] **Step 3: Implémenter `parsers/pdf.ts`**

Créer `nodes/NhmFileToText/parsers/pdf.ts` :

```typescript
import pdfParse from 'pdf-parse';

export async function parsePdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/parsers/pdf.test.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add nodes/NhmFileToText/parsers/pdf.ts tests/parsers/pdf.test.ts
git commit -m "feat(nhm-file-to-text): add PDF parser"
```

---

## Task 6 : Parser ODT

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/parsers/odt.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/parsers/odt.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/parsers/odt.test.ts` :

```typescript
import AdmZip from 'adm-zip';
import { parseOdt } from '../../nodes/NhmFileToText/parsers/odt';

function makeOdtBuffer(text: string): Buffer {
  const zip = new AdmZip();
  const contentXml = `<?xml version="1.0"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:p>${text}</text:p>
    </office:text>
  </office:body>
</office:document-content>`;
  zip.addFile('content.xml', Buffer.from(contentXml, 'utf-8'));
  return zip.toBuffer();
}

describe('parseOdt', () => {
  it('extrait le texte d\'un ODT valide', async () => {
    const buf = makeOdtBuffer('Bonjour ODT');
    const result = await parseOdt(buf);
    expect(result).toContain('Bonjour ODT');
  });

  it('retourne une chaîne vide si content.xml est vide', async () => {
    const zip = new AdmZip();
    zip.addFile('content.xml', Buffer.from('<root></root>', 'utf-8'));
    const result = await parseOdt(zip.toBuffer());
    expect(result).toBe('');
  });

  it('lance une erreur si content.xml est absent', async () => {
    const zip = new AdmZip();
    zip.addFile('other.xml', Buffer.from('<root/>', 'utf-8'));
    await expect(parseOdt(zip.toBuffer())).rejects.toThrow('content.xml introuvable');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
pnpm test -- tests/parsers/odt.test.ts
```

Expected: FAIL — `Cannot find module '../../nodes/NhmFileToText/parsers/odt'`

- [ ] **Step 3: Implémenter `parsers/odt.ts`**

Créer `nodes/NhmFileToText/parsers/odt.ts` :

```typescript
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

export async function parseOdt(buffer: Buffer): Promise<string> {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry('content.xml');
  if (!entry) throw new Error('content.xml introuvable dans le fichier ODT');

  const xml = entry.getData().toString('utf-8');
  const parsed = await parseStringPromise(xml, { explicitArray: true });

  const texts: string[] = [];
  extractTextNodes(parsed, texts);
  return texts.join(' ').trim();
}

function extractTextNodes(node: unknown, acc: string[]): void {
  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (trimmed) acc.push(trimmed);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) extractTextNodes(item, acc);
    return;
  }
  if (node !== null && typeof node === 'object') {
    for (const value of Object.values(node as Record<string, unknown>)) {
      extractTextNodes(value, acc);
    }
  }
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/parsers/odt.test.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add nodes/NhmFileToText/parsers/odt.ts tests/parsers/odt.test.ts
git commit -m "feat(nhm-file-to-text): add ODT parser"
```

---

## Task 7 : Router

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/router.ts`
- Create: `custom-nodes/nhm-file-to-text/tests/router.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `tests/router.test.ts` :

```typescript
jest.mock('../nodes/NhmFileToText/parsers/text', () => ({ parseText: jest.fn().mockResolvedValue('txt') }));
jest.mock('../nodes/NhmFileToText/parsers/html', () => ({ parseHtml: jest.fn().mockResolvedValue('html') }));
jest.mock('../nodes/NhmFileToText/parsers/docx', () => ({ parseDocx: jest.fn().mockResolvedValue('docx') }));
jest.mock('../nodes/NhmFileToText/parsers/pdf', () => ({ parsePdf: jest.fn().mockResolvedValue('pdf') }));
jest.mock('../nodes/NhmFileToText/parsers/odt', () => ({ parseOdt: jest.fn().mockResolvedValue('odt') }));

import { extractText, SUPPORTED_FORMATS } from '../nodes/NhmFileToText/router';

const buf = Buffer.from('fake');

describe('extractText — détection par MIME type', () => {
  it('route vers parseDocx pour application/vnd.openxmlformats-officedocument.wordprocessingml.document', async () => {
    const r = await extractText(buf, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'file.docx');
    expect(r.text).toBe('docx');
    expect(r.format).toBe('docx');
  });

  it('route vers parsePdf pour application/pdf', async () => {
    const r = await extractText(buf, 'application/pdf', 'file.pdf');
    expect(r.text).toBe('pdf');
    expect(r.format).toBe('pdf');
  });

  it('route vers parseOdt pour application/vnd.oasis.opendocument.text', async () => {
    const r = await extractText(buf, 'application/vnd.oasis.opendocument.text', 'file.odt');
    expect(r.text).toBe('odt');
    expect(r.format).toBe('odt');
  });

  it('route vers parseText pour text/plain', async () => {
    const r = await extractText(buf, 'text/plain', 'file.txt');
    expect(r.text).toBe('txt');
    expect(r.format).toBe('txt');
  });

  it('route vers parseText pour text/csv', async () => {
    const r = await extractText(buf, 'text/csv', 'file.csv');
    expect(r.text).toBe('txt');
    expect(r.format).toBe('csv');
  });

  it('route vers parseHtml pour text/html', async () => {
    const r = await extractText(buf, 'text/html', 'file.html');
    expect(r.text).toBe('html');
    expect(r.format).toBe('html');
  });
});

describe('extractText — fallback sur l\'extension', () => {
  it('détecte docx depuis l\'extension quand MIME est application/octet-stream', async () => {
    const r = await extractText(buf, 'application/octet-stream', 'document.docx');
    expect(r.text).toBe('docx');
    expect(r.format).toBe('docx');
  });

  it('détecte pdf depuis l\'extension', async () => {
    const r = await extractText(buf, 'application/octet-stream', 'rapport.pdf');
    expect(r.format).toBe('pdf');
  });
});

describe('extractText — format non supporté', () => {
  it('lance une erreur avec la liste des formats supportés', async () => {
    await expect(extractText(buf, 'application/zip', 'archive.zip')).rejects.toThrow(
      `Format non supporté. Formats acceptés : ${SUPPORTED_FORMATS.join(', ')}`,
    );
  });
});

describe('extractText — fileName dans le résultat', () => {
  it('retourne le fileName dans le résultat', async () => {
    const r = await extractText(buf, 'text/plain', 'mon-fichier.txt');
    expect(r.fileName).toBe('mon-fichier.txt');
  });
});
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

```bash
pnpm test -- tests/router.test.ts
```

Expected: FAIL — `Cannot find module '../nodes/NhmFileToText/router'`

- [ ] **Step 3: Implémenter `router.ts`**

Créer `nodes/NhmFileToText/router.ts` :

```typescript
import { parseText } from './parsers/text';
import { parseHtml } from './parsers/html';
import { parseDocx } from './parsers/docx';
import { parsePdf } from './parsers/pdf';
import { parseOdt } from './parsers/odt';

export const SUPPORTED_FORMATS = ['docx', 'pdf', 'odt', 'txt', 'csv', 'html'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

export interface ExtractResult {
  text: string;
  format: SupportedFormat;
  fileName: string;
}

const MIME_MAP: Record<string, SupportedFormat> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/html': 'html',
};

const EXT_MAP: Record<string, SupportedFormat> = {
  docx: 'docx',
  pdf: 'pdf',
  odt: 'odt',
  txt: 'txt',
  csv: 'csv',
  html: 'html',
  htm: 'html',
};

function detectFormat(mimeType: string, fileName: string): SupportedFormat {
  const fromMime = MIME_MAP[mimeType.toLowerCase().split(';')[0].trim()];
  if (fromMime) return fromMime;

  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const fromExt = EXT_MAP[ext];
  if (fromExt) return fromExt;

  throw new Error(`Format non supporté. Formats acceptés : ${SUPPORTED_FORMATS.join(', ')}`);
}

const PARSERS: Record<SupportedFormat, (buf: Buffer) => Promise<string>> = {
  docx: parseDocx,
  pdf: parsePdf,
  odt: parseOdt,
  txt: parseText,
  csv: parseText,
  html: parseHtml,
};

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractResult> {
  const format = detectFormat(mimeType, fileName);
  const text = await PARSERS[format](buffer);
  return { text, format, fileName };
}
```

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

```bash
pnpm test -- tests/router.test.ts
```

Expected: PASS — 10 tests passed

- [ ] **Step 5: Lancer tous les tests**

```bash
pnpm test
```

Expected: PASS — tous les tests passent (≥17 tests)

- [ ] **Step 6: Commit**

```bash
git add nodes/NhmFileToText/router.ts tests/router.test.ts
git commit -m "feat(nhm-file-to-text): add format router with MIME and extension detection"
```

---

## Task 8 : Node principal n8n

**Files:**
- Create: `custom-nodes/nhm-file-to-text/nodes/NhmFileToText/NhmFileToText.node.ts`

- [ ] **Step 1: Créer `NhmFileToText.node.ts`**

```typescript
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractText } from './router';

export class NhmFileToText implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Nhm File To Text',
    name: 'nhmFileToText',
    icon: 'fa:file-alt',
    group: ['transform'],
    version: 1,
    description: 'Extrait le texte de fichiers bureautiques (DOCX, PDF, ODT, TXT, CSV, HTML)',
    defaults: { name: 'Nhm File To Text' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Input Binary Field',
        name: 'inputField',
        type: 'string',
        default: 'data',
        required: true,
        description: 'Nom du champ binaire contenant le fichier',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const inputField = this.getNodeParameter('inputField', i) as string;
        const item = items[i];

        if (!item.binary?.[inputField]) {
          throw new NodeOperationError(
            this.getNode(),
            `Aucune donnée binaire trouvée dans le champ "${inputField}"`,
          );
        }

        const binaryData = item.binary[inputField];
        const buffer = Buffer.from(binaryData.data, 'base64');
        const mimeType = binaryData.mimeType ?? 'application/octet-stream';
        const fileName = binaryData.fileName ?? '';

        const result = await extractText(buffer, mimeType, fileName);
        returnData.push({ json: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        if (this.continueOnFail()) {
          returnData.push({ json: { error: message } });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
cd custom-nodes/nhm-file-to-text
pnpm build
```

Expected: compilation sans erreur, dossier `dist/` créé avec `dist/nodes/NhmFileToText/NhmFileToText.node.js`

- [ ] **Step 3: Commit**

```bash
git add nodes/NhmFileToText/NhmFileToText.node.ts
git commit -m "feat(nhm-file-to-text): add main n8n node"
```

---

## Task 9 : Intégration Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Ajouter le bloc nhm-file-to-text dans le Dockerfile**

Dans `Dockerfile`, après le bloc `nhm-custom-chat-model` (ligne ~23) et avant la section `# --- Copy all sources & build ---`, ajouter :

```dockerfile
# --- nhm-file-to-text ---
COPY ./custom-nodes/nhm-file-to-text/package.json /data/custom-nodes/nhm-file-to-text/package.json

WORKDIR /data/custom-nodes/nhm-file-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --no-frozen-lockfile --ignore-scripts
```

Et dans la section build (après les builds existants), ajouter :

```dockerfile
WORKDIR /data/custom-nodes/nhm-file-to-text
RUN pnpm run build
```

Le `Dockerfile` final doit ressembler à :

```dockerfile
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

# --- nhm-file-to-text ---
COPY ./custom-nodes/nhm-file-to-text/package.json /data/custom-nodes/nhm-file-to-text/package.json

WORKDIR /data/custom-nodes/nhm-file-to-text
RUN NODE_ENV=development pnpm install --store-dir /data/custom-nodes/.pnpm-store --no-frozen-lockfile --ignore-scripts

# --- Copy all sources & build ---
WORKDIR /data/custom-nodes
COPY ./custom-nodes/ /data/custom-nodes/

WORKDIR /data/custom-nodes/nhm-docx-to-text
RUN pnpm run build

WORKDIR /data/custom-nodes/nhm-custom-chat-model
RUN pnpm run build

WORKDIR /data/custom-nodes/nhm-file-to-text
RUN pnpm run build

USER node
```

- [ ] **Step 2: Vérifier que le build Docker fonctionne (local)**

```bash
docker build --build-arg N8N_VERSION=2.11.4 -t custom-n8n:test .
```

Expected: build réussi sans erreur, toutes les dépendances installées.

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat(nhm-file-to-text): integrate new node into Dockerfile build"
```

---

## Task 10 : Validation finale

- [ ] **Step 1: Lancer tous les tests**

```bash
cd custom-nodes/nhm-file-to-text
pnpm test
```

Expected: tous les tests passent, 0 échec.

- [ ] **Step 2: Vérifier le build du node**

```bash
pnpm build
```

Expected: compilation sans erreur TypeScript.

- [ ] **Step 3: Commit final**

```bash
cd ../..
git add .
git commit -m "feat(nhm-file-to-text): complete implementation - multi-format text extraction node"
```
