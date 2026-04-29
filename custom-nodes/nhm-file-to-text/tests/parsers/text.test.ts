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
