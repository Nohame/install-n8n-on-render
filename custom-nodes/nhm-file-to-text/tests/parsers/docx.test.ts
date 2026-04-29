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
