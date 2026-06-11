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

function truncateOpinion(text: string, maxLen: number): string {
	// Remove newlines and truncate cleanly at word boundary
	const flat = text.replace(/\n+/g, " ").trim();
	if (flat.length <= maxLen) return flat;
	const truncated = flat.slice(0, maxLen);
	// Don't break mid-word
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > maxLen * 0.7) return truncated.slice(0, lastSpace) + "...";
	return truncated + "...";
}

export function formatCompactCouncilResults(
	topic: string,
	opinions: MemberOpinion[],
	tallyResult: TallyResult,
	synthesis: string,
	tokenUsage: { input: number; output: number },
): string {
	const lines: string[] = [];

	lines.push("");
	lines.push(`🏛️  Council of Mine — "${topic}"`);
	lines.push("");

	// Opinions (one line each)
	lines.push("💭 Opinions:");
	for (const op of opinions) {
		const icon = getIcon(op.memberId);
		const summary = truncateOpinion(op.opinion, 90);
		lines.push(`  ${icon}  ${op.memberName.padEnd(18)} ${summary}`);
	}
	lines.push("");

	// Vote tallies
	lines.push("🗳️  Results:");
	const maxVotes = Math.max(...Object.values(tallyResult.voteCounts), 0);
	const sorted = Object.entries(tallyResult.voteCounts)
		.sort(([, a], [, b]) => b - a)
		.filter(([, count]) => count > 0);

	const winnerIds = new Set(tallyResult.winners.map((w) => w.memberId));

	for (const [memberIdStr, count] of sorted) {
		const memberId = Number.parseInt(memberIdStr, 10);
		const op = opinions.find((o) => o.memberId === memberId);
		if (!op) continue;
		const icon = getIcon(memberId);
		const barLen = maxVotes > 0 ? Math.round((count / maxVotes) * 12) : 0;
		const bar = "█".repeat(barLen).padEnd(12);
		const winner = winnerIds.has(memberId) ? "  ← Winner" : "";
		lines.push(
			`  ${icon}  ${op.memberName.padEnd(18)} ${bar}  ${count} vote${count === 1 ? "" : "s"}${winner}`,
		);
	}
	lines.push("");

	// Synthesis
	if (synthesis && !synthesis.startsWith("Unable to generate")) {
		lines.push("🎯 Synthesis:");
		// Word-wrap synthesis to ~72 chars
		const words = synthesis.split(" ");
		let synthLine = "";
		for (const word of words) {
			if (synthLine.length + word.length + 1 > 72) {
				lines.push(`   ${synthLine}`);
				synthLine = word;
			} else {
				synthLine = synthLine ? `${synthLine} ${word}` : word;
			}
		}
		if (synthLine) lines.push(`   ${synthLine}`);
		lines.push("");
	}

	// Token usage
	lines.push(
		`   ↑${tokenUsage.input.toLocaleString()} ↓${tokenUsage.output.toLocaleString()}  (${(tokenUsage.input + tokenUsage.output).toLocaleString()} total)`,
	);
	lines.push("");

	return lines.join("\n");
}
