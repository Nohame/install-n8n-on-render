import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';
import {
	BaseChatModel,
	type BaseChatModelCallOptions,
	type BaseChatModelParams,
} from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import type { ChatResult } from '@langchain/core/outputs';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { Runnable } from '@langchain/core/runnables';
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';

interface NhmChatModelFields extends BaseChatModelParams {
	apiUrl: string;
	bearerToken: string;
}

interface ToolCall {
	name: string;
	args: Record<string, unknown>;
	id: string;
}

class NhmHttpChatModel extends BaseChatModel {
	private apiUrl: string;
	private bearerToken: string;
	private boundTools: StructuredToolInterface[] = [];

	lc_serializable = false;

	constructor(fields: NhmChatModelFields) {
		super(fields);
		this.apiUrl = fields.apiUrl;
		this.bearerToken = fields.bearerToken;
	}

	_llmType(): string {
		return 'nhm_custom_http_chat';
	}

	/**
	 * Requis par n8n AI Agent pour autoriser la connexion.
	 * Retourne une nouvelle instance avec les tools injectés dans le prompt système.
	 */
	bindTools(
		tools: (StructuredToolInterface | Record<string, unknown>)[],
		_kwargs?: Partial<BaseChatModelCallOptions>,
	): Runnable<BaseLanguageModelInput, AIMessageChunk> {
		const clone = new NhmHttpChatModel({ apiUrl: this.apiUrl, bearerToken: this.bearerToken });
		clone.boundTools = tools.filter(
			(t): t is StructuredToolInterface => typeof (t as StructuredToolInterface).name === 'string',
		);
		return clone as unknown as Runnable<BaseLanguageModelInput, AIMessageChunk>;
	}

	async _generate(
		messages: BaseMessage[],
		_options: this['ParsedCallOptions'],
		_runManager?: CallbackManagerForLLMRun,
	): Promise<ChatResult> {
		// Construire le prompt depuis les messages
		let prompt = messages
			.map((m) => {
				const role =
					m._getType() === 'human'
						? 'User'
						: m._getType() === 'ai'
							? 'Assistant'
							: m._getType() === 'system'
								? 'System'
								: 'Tool';
				const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
				return `${role}: ${content}`;
			})
			.join('\n');

		// Injecter les définitions des tools si présents
		if (this.boundTools.length > 0) {
			const toolDefs = this.boundTools
				.map((t) => {
					const schema = 'schema' in t ? JSON.stringify(t.schema, null, 2) : '{}';
					return `- name: ${t.name}\n  description: ${t.description}\n  input_schema: ${schema}`;
				})
				.join('\n');

			prompt =
				`You have access to the following tools. When you need to use one, respond ONLY with valid JSON in this exact format (no extra text):\n` +
				`{"tool": "<tool_name>", "tool_input": {<args>}}\n\n` +
				`Available tools:\n${toolDefs}\n\n` +
				`When you have a final answer (no tool needed), respond normally.\n\n` +
				prompt;
		}

		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.bearerToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ prompt }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		const data = (await response.json()) as Record<string, unknown>;

		const rawText =
			(data.response as string) ??
			(data.text as string) ??
			(data.content as string) ??
			(data.message as string) ??
			(data.answer as string) ??
			(data.output as string) ??
			JSON.stringify(data);

		// Détecter un appel de tool dans la réponse (JSON { tool, tool_input })
		const toolCall = this.parseToolCall(rawText);

		if (toolCall) {
			const aiMsg = new AIMessage({
				content: '',
				tool_calls: [toolCall],
			});
			return { generations: [{ message: aiMsg, text: '' }] };
		}

		return {
			generations: [{ message: new AIMessage({ content: rawText }), text: rawText }],
		};
	}

	private parseToolCall(text: string): ToolCall | null {
		try {
			// Chercher un bloc JSON dans le texte
			const jsonMatch = text.match(/\{[\s\S]*"tool"[\s\S]*\}/);
			if (!jsonMatch) return null;

			const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
			if (typeof parsed.tool !== 'string') return null;

			return {
				name: parsed.tool,
				args: (parsed.tool_input as Record<string, unknown>) ?? {},
				id: `call_${Date.now()}`,
			};
		} catch {
			return null;
		}
	}
}

export class NhmCustomChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nhm Custom Chat Model',
		name: 'nhmCustomChatModel',
		icon: 'fa:robot',
		group: ['transform'],
		version: 1,
		description: 'Chat model personnalisé qui appelle une API HTTP locale (Bearer token)',
		defaults: {
			name: 'Nhm Custom Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {},
		},
		inputs: [],
		outputs: ['ai_languageModel'],
		outputNames: ['Model'],
		properties: [
			{
				displayName: 'API URL',
				name: 'apiUrl',
				type: 'string',
				default: 'http://localhost:3000/chat',
				required: true,
				description: "URL de l'endpoint POST qui accepte {\"prompt\": \"...\"}",
			},
			{
				displayName: 'Bearer Token',
				name: 'bearerToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				required: true,
				description: 'Token utilisé dans le header Authorization: Bearer <token>',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const apiUrl = this.getNodeParameter('apiUrl', itemIndex) as string;
		const bearerToken = this.getNodeParameter('bearerToken', itemIndex) as string;

		const model = new NhmHttpChatModel({ apiUrl, bearerToken });

		return {
			response: model,
		};
	}
}
