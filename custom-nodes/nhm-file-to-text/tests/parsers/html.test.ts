import { parseHtml } from '../../nodes/NhmFileToText/parsers/html';

describe('parseHtml', () => {
  it('extrait le texte en supprimant les balises HTML', async () => {
    const html = '<html><body><h1>Titre</h1><p>Paragraphe.</p></body></html>';
    const buf = Buffer.from(html, 'utf-8');
    const result = await parseHtml(buf);
    expect(result.toUpperCase()).toContain('TITRE');
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
