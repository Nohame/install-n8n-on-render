import { parseText } from './parsers/text';
import { parseHtml } from './parsers/html';
import { parseDocx } from './parsers/docx';
import { parsePdf } from './parsers/pdf';
import { parseOdt } from './parsers/odt';

export const SUPPORTED_FORMATS = ['docx', 'pdf', 'odt', 'txt', 'csv', 'html'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

export interface ExtractResult {
  text: string;
  format: SupportedFormat;
  fileName: string;
}

const MIME_MAP: Record<string, SupportedFormat> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/html': 'html',
};

const EXT_MAP: Record<string, SupportedFormat> = {
  docx: 'docx',
  pdf: 'pdf',
  odt: 'odt',
  txt: 'txt',
  csv: 'csv',
  html: 'html',
  htm: 'html',
};

function detectFormat(mimeType: string, fileName: string): SupportedFormat {
  const fromMime = MIME_MAP[mimeType.toLowerCase().split(';')[0].trim()];
  if (fromMime) return fromMime;

  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const fromExt = EXT_MAP[ext];
  if (fromExt) return fromExt;

  throw new Error(`Format non supporté. Formats acceptés : ${SUPPORTED_FORMATS.join(', ')}`);
}

const PARSERS: Record<SupportedFormat, (buf: Buffer) => Promise<string>> = {
  docx: parseDocx,
  pdf: parsePdf,
  odt: parseOdt,
  txt: parseText,
  csv: parseText,
  html: parseHtml,
};

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractResult> {
  const format = detectFormat(mimeType, fileName);
  const text = await PARSERS[format](buffer);
  return { text, format, fileName };
}
