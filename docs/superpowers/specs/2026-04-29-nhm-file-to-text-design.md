# Design : nhm-file-to-text

**Date :** 2026-04-29
**Statut :** Approuvé

## Objectif

Créer un node n8n custom `nhm-file-to-text` qui remplace `nhm-docx-to-text` en supportant tous les formats bureautiques courants. Le node détecte automatiquement le format du fichier et extrait son contenu textuel.

## Architecture

Le node vit dans `custom-nodes/nhm-file-to-text/` avec la même structure que les nodes existants (TypeScript, pnpm, gulp build).

Flux interne :
```
Binary input → detectFormat(mimeType || extension) → parser(buffer) → { text, format, fileName }
```

Structure des fichiers :
```
custom-nodes/nhm-file-to-text/
├── nodes/NhmFileToText/
│   ├── NhmFileToText.node.ts   # Node principal
│   ├── router.ts               # Mappe MIME type → parser
│   └── parsers/
│       ├── docx.ts             # mammoth
│       ├── pdf.ts              # pdf-parse
│       ├── odt.ts              # adm-zip + xml2js
│       ├── text.ts             # natif
│       └── html.ts             # html-to-text
├── package.json
├── tsconfig.json
└── gulpfile.js
```

## Formats supportés

| Format | MIME type | Librairie |
|--------|-----------|-----------|
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `mammoth` |
| PDF | `application/pdf` | `pdf-parse` |
| ODT | `application/vnd.oasis.opendocument.text` | `adm-zip` + `xml2js` |
| TXT | `text/plain` | natif (`buffer.toString()`) |
| CSV | `text/csv` | natif (`buffer.toString()`) |
| HTML | `text/html` | `html-to-text` |

Si le MIME type est générique (`application/octet-stream`), fallback sur l'extension du nom de fichier.

## Configuration du node

**Paramètre :**
- `inputField` (string, défaut `"data"`) — nom du champ binaire à lire

**Output JSON :**
```json
{
  "text": "contenu extrait...",
  "format": "pdf",
  "fileName": "document.pdf"
}
```

## Gestion d'erreurs

- Format non reconnu → erreur avec liste des formats supportés
- Champ binaire absent ou vide → erreur explicite
- Echec du parser (fichier corrompu, PDF encrypté) → message descriptif
- Respect de `continueOnFail()` : en mode tolérant, retourne `{ error: "..." }` au lieu de bloquer

## Intégration Docker

Le node `nhm-file-to-text` est ajouté au `Dockerfile` selon le même pattern que les nodes existants :
1. Copie du `package.json` + install des dépendances
2. Copie des sources + build
3. Variable `N8N_CUSTOM_EXTENSIONS` déjà configurée sur `/data/custom-nodes`

Le node `nhm-docx-to-text` reste en place pour rétrocompatibilité des workflows existants.
