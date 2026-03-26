import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import * as mammoth from 'mammoth';

export class NhmDocxToText implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nhm DOCX To Text',
		name: 'nhmDocxToText',
		icon: 'file:nhmDocxIcon.svg',
		group: ['transform'],
		version: 1,
		description: 'Extracts text from a DOCX file',
		defaults: {
			name: 'Nhm DOCX To Text',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Binary Field',
				name: 'inputField',
				type: 'string',
				default: 'data',
				description: 'The name of the binary field containing the DOCX file',
				required: true,
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

				if (!item.binary || !item.binary[inputField]) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data found for field "${inputField}"`,
					);
				}

				const docxBuffer = Buffer.from(item.binary[inputField].data, 'base64');
				const result = await mammoth.extractRawText({ buffer: docxBuffer });

				returnData.push({
					json: { text: result.value },
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';

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
