import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractText } from './router';

export class NhmFileToText implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Nhm File To Text',
    name: 'nhmFileToText',
    icon: 'fa:file-alt',
    group: ['transform'],
    version: 1,
    description: 'Extrait le texte de fichiers bureautiques (DOCX, PDF, ODT, TXT, CSV, HTML)',
    defaults: { name: 'Nhm File To Text' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Input Binary Field',
        name: 'inputField',
        type: 'string',
        default: 'data',
        required: true,
        description: 'Nom du champ binaire contenant le fichier',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const inputField = this.getNodeParameter('inputField', i) as string;
        const item = items[i];

        if (!item.binary?.[inputField]) {
          throw new NodeOperationError(
            this.getNode(),
            `Aucune donnée binaire trouvée dans le champ "${inputField}"`,
          );
        }

        const binaryData = item.binary[inputField];
        const buffer = Buffer.from(binaryData.data, 'base64');
        const mimeType = binaryData.mimeType ?? 'application/octet-stream';
        const fileName = binaryData.fileName ?? '';

        const result = await extractText(buffer, mimeType, fileName);
        returnData.push({ json: { ...result } });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        if (this.continueOnFail()) {
          returnData.push({ json: { error: message } });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
