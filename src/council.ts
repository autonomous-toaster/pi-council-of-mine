import type { Model, ThinkingLevel } from "@earendil-works/pi-ai";
import { generateAllOpinions, type MemberOpinion } from "./debate.ts";
import { conductVoting, type Vote } from "./voting.ts";
import { tallyVotes, generateSynthesis, type TallyResult } from "./results.ts";
import { formatCouncilResults } from "./texts.ts";
import { COUNCIL_MEMBERS } from "./members.ts";

export interface CouncilResult {
	opinions: MemberOpinion[];
	votes: Vote[];
	tallyResult: TallyResult;
	synthesis: string;
	formatted: string;
	tokenUsage: { input: number; output: number };
}

export interface CouncilConfig {
	apiKey: string;
	headers?: Record<string, string>;
	reasoning?: ThinkingLevel;
	maxTokens?: number;
	memberReasoning?: ThinkingLevel;
	memberMaxTokens?: number;
	memberConcurrency?: number;
	onStatus?: (message: string) => void;
	signal?: AbortSignal;
	tokenAccumulator?: { input: number; output: number };
}

function memberIcon(memberId: number): string {
	return COUNCIL_MEMBERS.find((m) => m.id === memberId)?.icon ?? "👤";
}

export async function runCouncilDebate(
	model: Model<any>,
	topic: string,
	config: CouncilConfig,
): Promise<CouncilResult> {
	const tokenAccumulator = { input: 0, output: 0 };

	const {
		apiKey,
		headers,
		reasoning,
		maxTokens,
		memberReasoning,
		memberMaxTokens,
		memberConcurrency,
		onStatus,
		signal,
	} = config;

	const opinionConfig = {
		apiKey,
		headers,
		reasoning: memberReasoning ?? reasoning,
		maxTokens: memberMaxTokens ?? 400,
		memberConcurrency: memberConcurrency ?? 3,
		tokenAccumulator,
	};
	const votingConfig = {
		apiKey,
		headers,
		reasoning: memberReasoning ?? reasoning,
		maxTokens: memberMaxTokens ?? 400,
		memberConcurrency: memberConcurrency ?? 3,
		tokenAccumulator,
	};
	const synthesisConfig = {
		apiKey,
		headers,
		reasoning,
		maxTokens: Math.min(maxTokens ?? 300, 300),
		tokenAccumulator,
	};

	// Phase 1: Opinions
	onStatus?.("Asking the council for their opinions...");
	const opinions = await generateAllOpinions(
		model,
		topic,
		opinionConfig,
		(current, total) => {
			const member = COUNCIL_MEMBERS[current - 1];
			onStatus?.(
				`📝 ${memberIcon(member.id)} ${member.name} — ${current}/${total}`,
			);
		},
		signal,
	);

	// Phase 2: Voting
	onStatus?.("Council is voting...");
	const votes = await conductVoting(
		model,
		topic,
		opinions,
		votingConfig,
		(current, total, member) => {
			onStatus?.(
				`🗳️  ${memberIcon(member.id)} ${member.name} voting — ${current}/${total}`,
			);
		},
		signal,
	);

	// Phase 3: Tally
	onStatus?.("Counting votes...");
	const tallyResult = tallyVotes(votes, opinions);

	// Phase 4: Synthesis
	onStatus?.("Generating synthesis...");
	const synthesis = await generateSynthesis(
		model,
		topic,
		opinions,
		tallyResult,
		synthesisConfig,
		signal,
	);

	// Format results
	const formatted = formatCouncilResults(
		topic,
		opinions,
		votes,
		tallyResult,
		synthesis,
	);

	return {
		opinions,
		votes,
		tallyResult,
		synthesis,
		formatted,
		tokenUsage: tokenAccumulator,
	};
}
