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
