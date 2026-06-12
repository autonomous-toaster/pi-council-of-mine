import {
	completeSimple,
	type Model,
	type ThinkingLevel,
	type TextContent,
	type ThinkingContent,
} from "@earendil-works/pi-ai";
import type { CouncilMember } from "./members.ts";
import type { MemberOpinion } from "./debate.ts";
import { batchMap } from "./batch.ts";

export interface Vote {
	voterId: number;
	voterName: string;
	votedForId: number;
	votedForName: string;
	reasoning: string;
}

export interface VotingConfig {
	apiKey: string;
	headers?: Record<string, string>;
	reasoning?: ThinkingLevel;
	maxTokens?: number;
	memberConcurrency?: number;
	tokenAccumulator?: { input: number; output: number };
}

const VOTE_MAX_TOKENS = 300;
const VOTE_TEMPERATURE = 0.7;

export function parseVoteResponse(
	responseText: string,
	validMemberIds: number[],
): { voteId: number | null; reasoning: string } {
	let voteId: number | null = null;
	let reasoning = "";

	const voteMatch = responseText.match(/(?:VOTE|Vote|vote):\s*(\d+)/);
	if (voteMatch) {
		voteId = parseInt(voteMatch[1], 10);
	}

	const reasoningParts = responseText.split(
		/(?:REASONING|Reasoning|reasoning):\s*/,
	);
	if (reasoningParts.length > 1) {
		reasoning = reasoningParts[1].trim();
	} else {
		reasoning = responseText.trim();
	}

	if (reasoning.length > 1000) {
		reasoning = reasoning.slice(0, 1000).trimEnd();
	}

	if (voteId === null) {
		// Fallback: scan for any number that's a valid member ID
		const numbers = responseText.match(/\b([1-9])\b/g);
		if (numbers) {
			for (const numStr of numbers) {
				const num = parseInt(numStr, 10);
				if (validMemberIds.includes(num)) {
					voteId = num;
					break;
				}
			}
		}
	}

	return { voteId, reasoning };
}

export async function getMemberVote(
	model: Model<any>,
	member: CouncilMember,
	topic: string,
	allOpinions: MemberOpinion[],
	config: VotingConfig,
	signal?: AbortSignal,
): Promise<{ voterId: number; votedForId: number | null; reasoning: string }> {
	const otherOpinions = allOpinions.filter((op) => op.memberId !== member.id);
	const validMemberIds = otherOpinions.map((op) => op.memberId);

	const opinionsText = otherOpinions
		.map((op) => `Opinion ${op.memberId} (by ${op.memberName}):\n${op.opinion}`)
		.join("\n\n");

	const votePrompt = `${member.personality}

You are ${member.name} (the ${member.archetype}).

=== DEBATE TOPIC ===
${topic}
=== END TOPIC ===

=== OTHER MEMBERS' OPINIONS ===
${opinionsText}
=== END OPINIONS ===

As ${member.name}, which opinion resonates most with your perspective and values?
You CANNOT vote for your own opinion.

Respond in this exact format:
VOTE: [opinion number]
REASONING: [1-2 sentences explaining why this opinion aligns with your values]`;

	try {
		const response = await completeSimple(
			model,
			{
				systemPrompt: member.personality,
				messages: [
					{ role: "user", content: votePrompt, timestamp: Date.now() },
				],
			},
			{
				apiKey: config.apiKey,
				headers: config.headers,
				reasoning: config.reasoning,
				maxTokens: config.maxTokens ?? VOTE_MAX_TOKENS,
				temperature: VOTE_TEMPERATURE,
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
		const responseText = textBlocks
			.map((b) => b.text)
			.join("\n")
			.trim();

		if (!responseText) {
			const thinkingBlocks = response.content.filter(
				(b): b is ThinkingContent => b.type === "thinking",
			);
			const fallback = thinkingBlocks
				.map((b) => b.thinking)
				.join("\n")
				.trim();
			return {
				voterId: member.id,
				votedForId: null,
				reasoning: fallback || "[Empty vote response]",
			};
		}

		const { voteId, reasoning } = parseVoteResponse(
			responseText,
			validMemberIds,
		);

		if (voteId !== null && !validMemberIds.includes(voteId)) {
			return {
				voterId: member.id,
				votedForId: null,
				reasoning: `Invalid vote target: ${voteId}`,
			};
		}

		return { voterId: member.id, votedForId: voteId, reasoning };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return {
			voterId: member.id,
			votedForId: null,
			reasoning: `[Error: ${msg}]`,
		};
	}
}

export async function conductVoting(
	model: Model<any>,
	topic: string,
	opinions: MemberOpinion[],
	config: VotingConfig,
	onProgress?: (current: number, total: number, member: CouncilMember) => void,
	signal?: AbortSignal,
): Promise<Vote[]> {
	// Notify all voters in progress
	for (let i = 0; i < opinions.length; i++) {
		const member = opinions[i];
		const councilMember: CouncilMember = {
			id: member.memberId,
			name: member.memberName,
			archetype: member.memberName.replace("The ", ""),
			personality: "",
			icon: member.icon,
		};
		onProgress?.(i + 1, opinions.length, councilMember);
	}

	const concurrency = config.memberConcurrency ?? 3;

	const results = await batchMap(opinions, concurrency, async (member, idx) => {
		const councilMember: CouncilMember = {
			id: member.memberId,
			name: member.memberName,
			archetype: member.memberName.replace("The ", ""),
			personality: "",
			icon: member.icon,
		};
		const vote = await getMemberVote(
			model,
			councilMember,
			topic,
			opinions,
			config,
			signal,
		);
		return { ...vote, voterName: member.memberName, idx };
	});

	const votes: Vote[] = [];
	for (const result of results) {
		if (result && typeof result === "object" && "error" in result) {
			continue; // skip failed votes
		}
		const vote = result as Awaited<ReturnType<typeof getMemberVote>> & {
			voterName: string;
		};
		if (vote.votedForId !== null) {
			const votedFor = opinions.find((op) => op.memberId === vote.votedForId);
			votes.push({
				voterId: vote.voterId,
				voterName: vote.voterName,
				votedForId: vote.votedForId,
				votedForName: votedFor?.memberName ?? `Member ${vote.votedForId}`,
				reasoning: vote.reasoning,
			});
		}
	}

	return votes;
}
