/**
 * Council of Mine Extension
 *
 * Registers an LLM-callable tool named `ask_council` that allows the executor model
 * to consult a council of 9 AI archetypes for diverse perspectives, voting, and synthesis.
 *
 * The council:
 * - Has 9 members with distinct personalities (Pragmatist, Visionary, Systems Thinker, etc.)
 * - Each member generates an opinion on the question
 * - Members then vote on each other's opinions
 * - Results are tallied, winners declared, and a synthesis is generated
 * - Council members have no tools — only provide text opinions
 *
 * Commands:
 * - /council on [provider/model] — Enable council tool (persists to config)
 * - /council off                 — Disable council tool (persists to config)
 * - /council config [key=value]  — Show/edit council configuration
 * - /council ask <question>      — Ask the council a question directly
 * - /council                     — Show status
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	type ExtensionAPI,
	getAgentDir,
} from "@earendil-works/pi-coding-agent";
import type { ThinkingLevel, TextContent } from "@earendil-works/pi-ai";
import { Text, type AutocompleteItem } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { runCouncilDebate, thinkingTokenBudget } from "./src/council.ts";
import { formatCompactCouncilResults } from "./src/texts.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface CouncilConfig {
	enabled: boolean;
	provider: string;
	model: string;
	maxTokens: number;
	reasoning: ThinkingLevel;
	maxUsesPerRun: number;
	/**
	 * Explicit member token budget override. When set, overrides the
	 * auto-scaled budget based on memberReasoning.
	 * When undefined, the budget is computed from memberReasoning level.
	 */
	memberMaxTokens?: number;
	memberReasoning: ThinkingLevel;
	memberConcurrency: number;
}

const DEFAULT_CONFIG: CouncilConfig = {
	enabled: false,
	provider: "anthropic",
	model: "claude-haiku-4.5",
	maxTokens: 4096,
	reasoning: "off",
	maxUsesPerRun: 3,
	memberReasoning: "off",
	memberConcurrency: 3,
};

const VALID_REASONING_LEVELS: ThinkingLevel[] = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
];

// ---------------------------------------------------------------------------
// System prompt guidance injected into executor
// ---------------------------------------------------------------------------

const EXECUTOR_COUNCIL_GUIDANCE = `
<ask_council-tool>
You have access to an "ask_council" tool that consults a Council of Mine — 9 AI minds with distinct
personalities (Pragmatist, Visionary, Systems Thinker, Optimist, Devil's Advocate, Mediator,
User Advocate, Traditionalist, Analyst) who debate your question, vote on the best answer,
and produce a synthesized conclusion.

Use ask_council when:
- You need diverse perspectives on a complex decision
- The trade-offs are nuanced and benefit from multiple viewpoints
- You want a democratic, debated answer rather than a single opinion

How it works:
1. You provide one question
2. All 9 council members generate opinions (2-4 sentences each)
3. Members vote on each other's opinions with reasoning
4. Votes are tallied, winner(s) declared, a synthesis is generated
5. You receive the complete formatted result

The council members have no tools and no access to your workspace — they only
see your question and their assigned personalities.
</ask_council-tool>`;

// ---------------------------------------------------------------------------
// Config file helpers
// ---------------------------------------------------------------------------

function councilConfigPath(): string {
	return join(getAgentDir(), "council.json");
}

function loadConfig(path?: string): CouncilConfig {
	const configPath = path ?? councilConfigPath();
	if (!existsSync(configPath)) return { ...DEFAULT_CONFIG };
	try {
		const raw = JSON.parse(readFileSync(configPath, "utf-8"));
		return {
			enabled:
				typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_CONFIG.enabled,
			provider:
				typeof raw.provider === "string"
					? raw.provider
					: DEFAULT_CONFIG.provider,
			model: typeof raw.model === "string" ? raw.model : DEFAULT_CONFIG.model,
			maxTokens:
				typeof raw.maxTokens === "number"
					? raw.maxTokens
					: DEFAULT_CONFIG.maxTokens,
			reasoning: VALID_REASONING_LEVELS.includes(raw.reasoning)
				? raw.reasoning
				: DEFAULT_CONFIG.reasoning,
			maxUsesPerRun:
				typeof raw.maxUsesPerRun === "number"
					? raw.maxUsesPerRun
					: DEFAULT_CONFIG.maxUsesPerRun,
			memberMaxTokens:
				typeof raw.memberMaxTokens === "number"
					? raw.memberMaxTokens
					: undefined,
			memberReasoning: VALID_REASONING_LEVELS.includes(raw.memberReasoning)
				? raw.memberReasoning
				: DEFAULT_CONFIG.memberReasoning,
			memberConcurrency:
				typeof raw.memberConcurrency === "number" &&
				Number.isInteger(raw.memberConcurrency) &&
				raw.memberConcurrency >= 1
					? raw.memberConcurrency
					: DEFAULT_CONFIG.memberConcurrency,
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

function saveConfig(config: CouncilConfig, path?: string): void {
	const configPath = path ?? councilConfigPath();
	const dir = dirname(configPath);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function councilExtension(pi: ExtensionAPI) {
	let config = loadConfig();
	let usesThisRun = 0;

	// ── lifecycle hooks ────────────────────────────────────────────────

	pi.on("before_agent_start", async (event) => {
		config = loadConfig();
		if (!config.enabled) return;
		return {
			systemPrompt: `${event.systemPrompt}\n\n${EXECUTOR_COUNCIL_GUIDANCE}`,
		};
	});

	pi.on("agent_start", async () => {
		usesThisRun = 0;
	});

	pi.on("session_start", async (_event, ctx) => {
		config = loadConfig();
		updateToolRegistration();
		ctx.ui.setStatus("council", undefined);
	});

	function updateToolRegistration() {
		const activeTools = pi.getActiveTools();
		if (config.enabled) {
			if (!activeTools.includes("ask_council")) {
				pi.setActiveTools([...activeTools, "ask_council"]);
			}
			return;
		}
		if (activeTools.includes("ask_council")) {
			pi.setActiveTools(activeTools.filter((t) => t !== "ask_council"));
		}
	}

	// ── tool registration ──────────────────────────────────────────────

	pi.registerTool({
		name: "ask_council",
		label: "Ask the Council",
		description: `Consult the Council of Mine — 9 AI archetypes with distinct personalities who debate your question, vote on the best answer, and produce a balanced synthesis.

Each council member generates an opinion, then members vote on each other's opinions with reasoning. The winner is declared and a unified synthesis is produced.

Use this when you need diverse perspectives on a complex decision. Council members have no tools — they only see your question.`,
		promptSnippet:
			'ask_council({ question: "Should we use approach X or Y?" }) → council opinions + votes + synthesis',
		promptGuidelines: [
			"Call ask_council with a clear, specific question when you need diverse perspectives on a complex decision",
			"The question should be self-contained — council members don't see your conversation history",
			"Keep questions concise but precise enough for informed opinions",
			"All 9 members will respond, vote, and a synthesis will be generated",
		],
		parameters: Type.Object({
			question: Type.String({
				description:
					"The question for the council to debate. Be specific and self-contained.",
			}),
		}),

		renderCall(args, theme, _context) {
			const question = args.question || "";
			const truncated =
				question.length > 120 ? question.slice(0, 117) + "..." : question;
			return new Text(
				theme.fg("toolTitle", theme.bold("ask_council ")) +
					theme.fg("muted", truncated),
				0,
				0,
			);
		},

		renderResult(result, options, theme, _context) {
			if (options.expanded || result.content.length === 0) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}
			// Collapsed: compact one-line summary
			const fullText = result.content
				.filter((c): c is TextContent => c.type === "text")
				.map((c) => c.text)
				.join("\n");
			const winnerLine = fullText.match(/🏆\s*(.+)/);
			let summary = "Council debate complete";
			if (winnerLine) {
				summary = "🏆 " + winnerLine[1];
			}
			return new Text(
				theme.fg("success", "✓ ") + theme.fg("muted", summary),
				0,
				0,
			);
		},

		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			config = loadConfig();
			usesThisRun++;

			if (!config.enabled) {
				return {
					content: [
						{
							type: "text",
							text: "Council of Mine is disabled. Use /council on to enable.",
						},
					],
				};
			}

			if (usesThisRun > config.maxUsesPerRun) {
				return {
					content: [
						{
							type: "text",
							text: `Council usage limit reached (${config.maxUsesPerRun} per run). Continue without council advice.`,
						},
					],
				};
			}

			const model = ctx.modelRegistry.find(config.provider, config.model);
			if (!model) {
				return {
					content: [
						{
							type: "text",
							text: `Council model ${config.provider}/${config.model} not found in model registry.`,
						},
					],
				};
			}

			const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
			if (!auth.ok || !auth.apiKey) {
				const errorMsg = auth.ok ? "No API key configured" : auth.error;
				return {
					content: [
						{
							type: "text",
							text: `${errorMsg} for council model ${config.provider}/${config.model}.`,
						},
					],
				};
			}

			ctx.ui.notify(
				`🏛️ Council of Mine: debating "${params.question.slice(0, 80)}..."`,
				"info",
			);

			try {
				const result = await runCouncilDebate(model, params.question, {
					apiKey: auth.apiKey,
					headers: auth.headers,
					reasoning: config.reasoning,
					maxTokens: config.maxTokens,
					memberReasoning: config.memberReasoning,
					memberMaxTokens: config.memberMaxTokens,
					memberConcurrency: config.memberConcurrency,
					onStatus: (msg) => {
						ctx.ui.notify(msg, "info");
					},
					signal,
				});

				ctx.ui.notify("✅ Council debate complete!", "info");

				const winners = result.tallyResult.winners;
				const winnersStr =
					winners.length === 1
						? `🏆 ${winners[0].memberName} (${winners[0].votesReceived} votes)`
						: winners.length > 1
							? `🏆 Tie: ${winners.map((w) => `${w.memberName} (${w.votesReceived} votes)`).join(", ")}`
							: "No winner";
				ctx.ui.notify(
					`${winnersStr} — ↑${result.tokenUsage.input.toLocaleString()} ↓${result.tokenUsage.output.toLocaleString()} (${(result.tokenUsage.input + result.tokenUsage.output).toLocaleString()} total)`,
					"info",
				);

				return {
					content: [{ type: "text", text: result.formatted }],
				};
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return {
					content: [{ type: "text", text: `Council debate failed: ${msg}` }],
				};
			}
		},
	});

	// ── command registration ───────────────────────────────────────────

	const SUBCOMMANDS = ["on", "off", "ask", "config"] as const;
	const CONFIG_KEYS = [
		"provider",
		"model",
		"maxTokens",
		"reasoning",
		"maxUsesPerRun",
		"memberMaxTokens",
		"memberReasoning",
		"memberConcurrency",
	] as const;

	pi.registerCommand("council", {
		description: "Manage Council of Mine tool: on, off, config, ask",

		getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
			const trimmed = prefix.trim();
			if (!trimmed) {
				// No subcommand yet — suggest all
				return SUBCOMMANDS.map((s) => ({ value: s, label: s }));
			}

			const parts = trimmed.split(/\s+/);
			const first = parts[0]?.toLowerCase();

			if (
				!first ||
				!SUBCOMMANDS.includes(first as (typeof SUBCOMMANDS)[number])
			) {
				// First word is not a recognized subcommand — filter subcommands
				const filtered = SUBCOMMANDS.filter((s) => s.startsWith(first ?? ""));
				return filtered.length > 0
					? filtered.map((s) => ({ value: s, label: s }))
					: null;
			}

			// First word is a recognized subcommand — check what follows
			if (first === "config") {
				const second = parts[1] ?? "";
				const filtered = CONFIG_KEYS.filter((k) =>
					k.startsWith(second.replace(/=$/, "")),
				);
				return filtered.length > 0
					? filtered.map((k) => ({
							value: `${k}=`,
							label: `${k}=`,
						}))
					: null;
			}

			// For on, off, ask — no further completions
			return null;
		},

		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/);
			const subcommand = parts[0]?.toLowerCase() || "";

			switch (subcommand) {
				case "on": {
					const rest = parts.slice(1).join(" ");
					if (rest) {
						const modelParts = rest.split("/");
						if (modelParts.length === 2) {
							config.provider = modelParts[0];
							config.model = modelParts[1];
						} else {
							ctx.ui.notify(
								"Invalid format. Use: /council on provider/model (e.g., anthropic/claude-opus-4-6)",
								"warning",
							);
							return;
						}
					}

					const model = ctx.modelRegistry.find(config.provider, config.model);
					if (!model) {
						ctx.ui.notify(
							`Model ${config.provider}/${config.model} not found in model registry`,
							"error",
						);
						return;
					}

					config.enabled = true;
					saveConfig(config);
					updateToolRegistration();
					ctx.ui.setStatus(
						"council",
						ctx.ui.theme.fg("success", "Council Active"),
					);
					ctx.ui.notify(
						`Council of Mine enabled: ${config.provider}/${config.model}`,
						"info",
					);
					break;
				}

				case "off": {
					config.enabled = false;
					saveConfig(config);
					updateToolRegistration();
					ctx.ui.setStatus("council", undefined);
					ctx.ui.notify("Council of Mine disabled", "info");
					break;
				}

				case "ask": {
					const question = parts.slice(1).join(" ").trim();
					if (!question) {
						ctx.ui.notify(
							"Usage: /council ask <question>\nExample: /council ask Should I use SQLite or PostgreSQL?",
							"info",
						);
						return;
					}

					const model = ctx.modelRegistry.find(config.provider, config.model);
					if (!model) {
						ctx.ui.notify(
							`Council model ${config.provider}/${config.model} not found in model registry`,
							"error",
						);
						return;
					}

					const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
					if (!auth.ok || !auth.apiKey) {
						const errorMsg = auth.ok ? "No API key configured" : auth.error;
						ctx.ui.notify(
							`${errorMsg} for council model ${config.provider}/${config.model}.`,
							"error",
						);
						return;
					}

					ctx.ui.notify(
						`🏛️ Council of Mine: debating "${question.slice(0, 80)}..."`,
						"info",
					);

					try {
						const result = await runCouncilDebate(model, question, {
							apiKey: auth.apiKey,
							headers: auth.headers,
							reasoning: config.reasoning,
							maxTokens: config.maxTokens,
							memberReasoning: config.memberReasoning,
							memberMaxTokens: config.memberMaxTokens,
							memberConcurrency: config.memberConcurrency,
							onStatus: (msg) => {
								ctx.ui.notify(msg, "info");
							},
						});

						ctx.ui.notify("✅ Council debate complete!", "info");

						const compact = formatCompactCouncilResults(
							question,
							result.opinions,
							result.tallyResult,
							result.synthesis,
							result.tokenUsage,
						);

						ctx.ui.notify(compact, "info");
					} catch (err) {
						const msg = err instanceof Error ? err.message : String(err);
						ctx.ui.notify(`Council debate failed: ${msg}`, "error");
					}
					break;
				}

				case "config": {
					const rest = parts.slice(1).join(" ");
					if (!rest) {
						const status = config.enabled
							? ctx.ui.theme.fg("success", "enabled")
							: ctx.ui.theme.fg("dim", "disabled");
						const lines = [
							"Council of Mine Configuration",
							"",
							`  Status:       ${status}`,
							`  Provider:     ${config.provider}`,
							`  Model:        ${config.model}`,
							`  Max tokens:   ${config.maxTokens}`,
							`  Reasoning:    ${config.reasoning}`,
							`  Max uses/run: ${config.maxUsesPerRun}`,
							`  Member tokens:   ${config.memberMaxTokens ?? `auto (${thinkingTokenBudget(config.memberReasoning, 400)} for ${config.memberReasoning})`}`,
							`  Member reasoning: ${config.memberReasoning}`,
							`  Member concurrency: ${config.memberConcurrency}`,
							"",
							"Usage:",
							"  /council on [provider/model]  Enable council",
							"  /council off                  Disable council",
							"  /council ask <question>       Ask the council a question",
							"  /council config key=value     Set config value",
							"",
							"Config keys: provider, model, maxTokens, reasoning, maxUsesPerRun, memberMaxTokens, memberReasoning, memberConcurrency",
							`Reasoning levels: ${VALID_REASONING_LEVELS.join(", ")}`,
						];
						ctx.ui.notify(lines.join("\n"), "info");
						return;
					}

					const match = rest.match(/^(\w+)=(.+)$/);
					if (!match) {
						ctx.ui.notify(
							"Invalid format. Use: /council config key=value",
							"warning",
						);
						return;
					}

					const [, key, value] = match;
					switch (key) {
						case "provider":
							config.provider = value;
							break;
						case "model":
							config.model = value;
							break;
						case "maxTokens": {
							const num = Number.parseInt(value, 10);
							if (Number.isNaN(num) || num < 100) {
								ctx.ui.notify("maxTokens must be at least 100", "warning");
								return;
							}
							config.maxTokens = num;
							break;
						}
						case "reasoning": {
							if (!VALID_REASONING_LEVELS.includes(value as ThinkingLevel)) {
								ctx.ui.notify(
									"reasoning must be one of: minimal, low, medium, high, xhigh",
									"warning",
								);
								return;
							}
							config.reasoning = value as ThinkingLevel;
							break;
						}
						case "maxUsesPerRun": {
							const num = Number.parseInt(value, 10);
							if (Number.isNaN(num) || num < 1) {
								ctx.ui.notify(
									"maxUsesPerRun must be a positive integer",
									"warning",
								);
								return;
							}
							config.maxUsesPerRun = num;
							break;
						}
						case "memberMaxTokens": {
							const num = Number.parseInt(value, 10);
							if (Number.isNaN(num) || num < 100) {
								ctx.ui.notify(
									"memberMaxTokens must be at least 100",
									"warning",
								);
								return;
							}
							config.memberMaxTokens = num;
							break;
						}
						case "memberReasoning": {
							if (!VALID_REASONING_LEVELS.includes(value as ThinkingLevel)) {
								ctx.ui.notify(
									"memberReasoning must be one of: minimal, low, medium, high, xhigh",
									"warning",
								);
								return;
							}
							config.memberReasoning = value as ThinkingLevel;
							break;
						}
						case "memberConcurrency": {
							const num = Number.parseInt(value, 10);
							if (Number.isNaN(num) || num < 1) {
								ctx.ui.notify(
									"memberConcurrency must be at least 1",
									"warning",
								);
								return;
							}
							config.memberConcurrency = num;
							break;
						}
						default:
							ctx.ui.notify(
								"Unknown config key. Valid keys: provider, model, maxTokens, reasoning, maxUsesPerRun, memberMaxTokens, memberReasoning, memberConcurrency",
								"warning",
							);
							return;
					}

					saveConfig(config);
					ctx.ui.notify(`Set ${key}=${value}`, "info");
					break;
				}

				default: {
					const status = config.enabled
						? ctx.ui.theme.fg("success", "enabled")
						: ctx.ui.theme.fg("dim", "disabled");
					const lines = [
						`Council of Mine: ${status}`,
						`Model:     ${config.provider}/${config.model}`,
						`Reasoning: ${config.reasoning}`,
						"",
						"Commands:",
						"  /council on [provider/model]  Enable council",
						"  /council off                  Disable council",
						"  /council ask <question>       Ask the council a question",
						"  /council config               Show full configuration",
					];
					ctx.ui.notify(lines.join("\n"), "info");
				}
			}
		},
	});
}
