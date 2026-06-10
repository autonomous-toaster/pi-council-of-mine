import type { MemberOpinion } from "./debate.ts";
import type { Vote } from "./voting.ts";
import type { TallyResult } from "./results.ts";
import { COUNCIL_MEMBERS } from "./members.ts";

function getIcon(memberId: number): string {
	return COUNCIL_MEMBERS.find((m) => m.id === memberId)?.icon ?? "👤";
}

export function formatCouncilResults(
	topic: string,
	opinions: MemberOpinion[],
	votes: Vote[],
	tallyResult: TallyResult,
	synthesis: string,
): string {
	const lines: string[] = [];
	const separator = "=".repeat(80);

	lines.push(separator);
	lines.push("🏛️  COUNCIL OF MINE");
	lines.push(separator);
	lines.push("");
	lines.push(`TOPIC: ${topic}`);
	lines.push("");

	// All opinions
	lines.push(separator);
	lines.push("💭 COUNCIL MEMBER OPINIONS");
	lines.push(separator);

	for (const opinion of opinions) {
		const icon = getIcon(opinion.memberId);
		const voteCount = tallyResult.voteCounts[opinion.memberId] ?? 0;
		lines.push("");
		lines.push(`${icon} ${opinion.memberName.toUpperCase()}`);
		lines.push(`Votes received: ${voteCount}`);
		lines.push("-".repeat(80));
		lines.push(opinion.opinion);
		lines.push("");
	}

	// Winners
	lines.push(separator);
	lines.push("🏆 WINNER(S)");
	lines.push(separator);

	if (tallyResult.winners.length > 0) {
		for (const winner of tallyResult.winners) {
			const icon = getIcon(winner.memberId);
			lines.push("");
			lines.push(`${icon} ${winner.memberName}`);
			lines.push(`Votes: ${winner.votesReceived}`);
			lines.push("");
		}
	} else {
		lines.push("");
		lines.push("No votes were cast.");
		lines.push("");
	}

	// Synthesis
	lines.push(separator);
	lines.push("🎯 SYNTHESIS");
	lines.push(separator);
	lines.push("");
	lines.push(synthesis);
	lines.push("");

	// All votes & reasoning
	lines.push(separator);
	lines.push("🗳️  VOTE BREAKDOWN");
	lines.push(separator);

	if (votes.length > 0) {
		for (const vote of votes) {
			const voterIcon = getIcon(vote.voterId);
			lines.push("");
			lines.push(`${voterIcon} ${vote.voterName} → ${vote.votedForName}`);
			if (vote.reasoning) {
				lines.push(`  Reasoning: ${vote.reasoning}`);
			}
			lines.push("");
		}
	} else {
		lines.push("");
		lines.push("No votes were cast.");
		lines.push("");
	}

	// Stats
	lines.push(separator);
	lines.push("📊 STATISTICS");
	lines.push(separator);
	lines.push(`Total opinions: ${opinions.length}`);
	lines.push(`Total votes cast: ${votes.length}`);
	lines.push(`Number of winners: ${tallyResult.winners.length}`);
	lines.push(separator);

	return lines.join("\n");
}
