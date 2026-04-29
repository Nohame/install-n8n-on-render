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
