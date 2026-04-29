import { convert } from 'html-to-text';

export async function parseHtml(buffer: Buffer): Promise<string> {
  const html = buffer.toString('utf-8');
  if (!html.trim()) return '';
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'h1', options: { uppercase: false } },
      { selector: 'h2', options: { uppercase: false } },
      { selector: 'h3', options: { uppercase: false } },
      { selector: 'h4', options: { uppercase: false } },
      { selector: 'h5', options: { uppercase: false } },
      { selector: 'h6', options: { uppercase: false } },
    ],
  });
}
