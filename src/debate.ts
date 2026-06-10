import {
	completeSimple,
	type Model,
	type ThinkingLevel,
	type TextContent,
	type ThinkingContent,
} from "@earendil-works/pi-ai";
import { COUNCIL_MEMBERS, type CouncilMember } from "./members.ts";
import { batchMap } from "./batch.ts";

export interface MemberOpinion {
	memberId: number;
	memberName: string;
	icon: string;
	opinion: string;
}

export interface OpinionGenerationConfig {
	apiKey: string;
	headers?: Record<string, string>;
	reasoning?: ThinkingLevel;
	maxTokens?: number;
	memberConcurrency?: number;
	tokenAccumulator?: { input: number; output: number };
}

const OPINION_MAX_TOKENS = 400;
const OPINION_TEMPERATURE = 0.8;

function buildOpinionPrompt(
	member: CouncilMember,
	topic: string,
): { systemPrompt: string; userMessage: string } {
	const systemPrompt = member.personality;

	const userMessage = `=== DEBATE TOPIC ===
${topic}
=== END TOPIC ===

Provide your opinion on this topic in 2-4 sentences as ${member.name} (the ${member.archetype}).
Stay true to your character and perspective.`;

	return { systemPrompt, userMessage };
}

export async function generateOpinion(
	model: Model<any>,
	member: CouncilMember,
	topic: string,
	config: OpinionGenerationConfig,
	signal?: AbortSignal,
): Promise<MemberOpinion> {
	const { systemPrompt, userMessage } = buildOpinionPrompt(member, topic);

	const response = await completeSimple(
		model,
		{
			systemPrompt,
			messages: [{ role: "user", content: userMessage, timestamp: Date.now() }],
		},
		{
			apiKey: config.apiKey,
			headers: config.headers,
			reasoning: config.reasoning,
			maxTokens: config.maxTokens ?? OPINION_MAX_TOKENS,
			temperature: OPINION_TEMPERATURE,
			signal,
		},
	);

	if (config.tokenAccumulator && response.usage) {
		config.tokenAccumulator.input += response.usage.input;
		config.tokenAccumulator.output += response.usage.output;
	}

	const textBlocks = response.content.filter(
		(b): b is TextContent => b.type === "text",
	);
	const opinionText = textBlocks
		.map((b) => b.text)
		.join("\n")
		.trim();

	if (!opinionText && !response.errorMessage) {
		const thinkingBlocks = response.content.filter(
			(b): b is ThinkingContent => b.type === "thinking",
		);
		const fallback = thinkingBlocks
			.map((b) => b.thinking)
			.join("\n")
			.trim();
		return {
			memberId: member.id,
			memberName: member.name,
			icon: member.icon,
			opinion: fallback || "[Empty response from model]",
		};
	}

	return {
		memberId: member.id,
		memberName: member.name,
		icon: member.icon,
		opinion:
			opinionText || response.errorMessage || "[Error obtaining opinion]",
	};
}

export async function generateAllOpinions(
	model: Model<any>,
	topic: string,
	config: OpinionGenerationConfig,
	onProgress?: (current: number, total: number, member: CouncilMember) => void,
	signal?: AbortSignal,
): Promise<MemberOpinion[]> {
	// Notify all members in progress
	for (let i = 0; i < COUNCIL_MEMBERS.length; i++) {
		onProgress?.(i + 1, COUNCIL_MEMBERS.length, COUNCIL_MEMBERS[i]);
	}

	const concurrency = config.memberConcurrency ?? 3;

	const results = await batchMap(COUNCIL_MEMBERS, concurrency, (member) =>
		generateOpinion(model, member, topic, config, signal),
	);

	const opinions: MemberOpinion[] = [];
	let failures = 0;

	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		const member = COUNCIL_MEMBERS[i];

		if (result && typeof result === "object" && "error" in result) {
			failures++;
			opinions.push({
				memberId: member.id,
				memberName: member.name,
				icon: member.icon,
				opinion: `${member.name} was unable to provide an opinion.`,
			});
		} else {
			opinions.push(result as MemberOpinion);
		}
	}

	if (failures === COUNCIL_MEMBERS.length) {
		throw new Error(
			"Council debate failed: all council members failed to generate opinions.",
		);
	}

	return opinions;
}
