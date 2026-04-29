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
