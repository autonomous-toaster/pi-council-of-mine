import {
	completeSimple,
	type Model,
	type ThinkingLevel,
	type TextContent,
	type ThinkingContent,
} from "@earendil-works/pi-ai";
import type { MemberOpinion } from "./debate.ts";
import type { Vote } from "./voting.ts";

export interface TallyResult {
	voteCounts: Record<number, number>;
	winners: Array<{
		memberId: number;
		memberName: string;
		votesReceived: number;
	}>;
}

export interface SynthesisConfig {
	apiKey: string;
	headers?: Record<string, string>;
	reasoning?: ThinkingLevel;
	maxTokens?: number;
	tokenAccumulator?: { input: number; output: number };
}

const SYNTHESIS_MAX_TOKENS = 300;
const SYNTHESIS_TEMPERATURE = 0.7;

export function tallyVotes(
	votes: Vote[],
	opinions: MemberOpinion[],
): TallyResult {
	const voteCounts: Record<number, number> = {};
	for (const opinion of opinions) {
		voteCounts[opinion.memberId] = 0;
	}
	for (const vote of votes) {
		if (voteCounts[vote.votedForId] !== undefined) {
			voteCounts[vote.votedForId]++;
		}
	}

	const maxVotes = Math.max(...Object.values(voteCounts), 0);
	const winners = Object.entries(voteCounts)
		.filter(([, count]) => count === maxVotes && maxVotes > 0)
		.map(([memberIdStr]) => {
			const memberId = parseInt(memberIdStr, 10);
			const opinion = opinions.find((op) => op.memberId === memberId);
			return {
				memberId,
				memberName: opinion?.memberName ?? `Member ${memberId}`,
				votesReceived: voteCounts[memberId],
			};
		});

	return { voteCounts, winners };
}

export async function generateSynthesis(
	model: Model<any>,
	topic: string,
	opinions: MemberOpinion[],
	tallyResult: TallyResult,
	config: SynthesisConfig,
	signal?: AbortSignal,
): Promise<string> {
	const allOpinionsText = opinions
		.map((op) => `${op.memberName} (${op.memberId}):\n${op.opinion}`)
		.join("\n\n");

	const voteSummary = Object.entries(tallyResult.voteCounts)
		.sort(([, a], [, b]) => b - a)
		.map(([memberIdStr, count]) => {
			const memberId = parseInt(memberIdStr, 10);
			const opinion = opinions.find((op) => op.memberId === memberId);
			return `- ${opinion?.memberName ?? `Member ${memberId}`} received ${count} vote(s)`;
		})
		.join("\n");

	const synthesisPrompt =
		"The Council of Mine has debated a topic. Generate a balanced synthesis.\n\n" +
		"=== DEBATE TOPIC ===\n" +
		`${topic}\n` +
		"=== END TOPIC ===\n\n" +
		"=== COUNCIL MEMBER OPINIONS ===\n" +
		`${allOpinionsText}\n` +
		"=== END OPINIONS ===\n\n" +
		"=== VOTING RESULTS ===\n" +
		`${voteSummary}\n` +
		"=== END RESULTS ===\n\n" +
		"Generate a balanced synthesis (3-4 sentences) that:\n" +
		"1. Identifies the winning perspective and why it resonated\n" +
		"2. Acknowledges key insights from other perspectives\n" +
		"3. Presents a unified conclusion that respects the diversity of viewpoints\n\n" +
		"Be concise and insightful.";

	try {
		const response = await completeSimple(
			model,
			{
				systemPrompt:
					"You are a neutral synthesizer. Your role is to produce balanced summaries of council debates.",
				messages: [
					{ role: "user", content: synthesisPrompt, timestamp: Date.now() },
				],
			},
			{
				apiKey: config.apiKey,
				headers: config.headers,
				reasoning: config.reasoning,
				maxTokens: config.maxTokens ?? SYNTHESIS_MAX_TOKENS,
				temperature: SYNTHESIS_TEMPERATURE,
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
		const synthesis = textBlocks
			.map((b) => b.text)
			.join("\n")
			.trim();

		if (!synthesis) {
			const thinkingBlocks = response.content.filter(
				(b): b is ThinkingContent => b.type === "thinking",
			);
			return (
				thinkingBlocks
					.map((b) => b.thinking)
					.join("\n")
					.trim() || "Unable to generate synthesis."
			);
		}

		return synthesis;
	} catch {
		return "Unable to generate synthesis.";
	}
}
