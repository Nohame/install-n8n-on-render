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
