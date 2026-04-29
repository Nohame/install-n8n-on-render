import { convert } from 'html-to-text';

export async function parseHtml(buffer: Buffer): Promise<string> {
  const html = buffer.toString('utf-8');
  if (!html.trim()) return '';
  return convert(html, { wordwrap: false });
}
