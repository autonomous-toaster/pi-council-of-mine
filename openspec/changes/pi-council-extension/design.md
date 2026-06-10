## Context

The pi coding agent has an established extension pattern for LLM-callable tools (pi-advisor). The council-of-mine MCP server has a proven debate+voting+synthesis flow with 9 archetypal members. This design adapts the council-of-mine logic to pi's extension API, reusing the same personality prompts, voting flow, and synthesis prompt structure — but in TypeScript, without MCP, and configurable like pi-advisor.

## Goals / Non-Goals

**Goals:**
- Single tool `ask_council` that the executor calls with a question and receives complete results
- 9 council members with same archetypes and personality prompts as council-of-mine
- Opinion generation, voting, tally, and synthesis in one tool execution
- Configurable provider, model, thinking level, maxTokens (same for all members in v0)
- Temperatures matching council-of-mine: 0.8 for opinions, 0.7 for voting, 0.7 for synthesis
- Sequential member execution (architected for easy parallelization later)
- Minimal TUI via `ctx.ui.notify`
- `/council` command for on/off/config/manual trigger (mirrors `/advisor`)

**Non-Goals:**
- Per-member model/provider config (future)
- Parallel execution (future optimization)
- Custom archetype definitions (fixed 9 for v0)
- Question refinement or multi-turn debate
- Heavy TUI or HTML rendering
- Session persistence of debate results (results are ephemeral, returned in tool response)

## Decisions

**1. Single tool vs staged tools** — Single tool `ask_council` that returns the complete result. Simpler for the executor: one call, one answer. The tool takes a required `question` string and returns a formatted text response with all opinions, votes, winners, and synthesis.

**2. Sequential execution, parallel-ready** — Members are called sequentially in a `for...of` loop. The opinion generation function is wrapped in a way that a simple change from `for...of` to `Promise.all(members.map(...))` enables parallel execution later. Voting is sequential since each vote depends on all opinions being available.

**3. completeSimple for LLM calls** — Each council member call uses `completeSimple(model, { systemPrompt: personalityPrompt, messages: [{ role: "user", content: question }] }, { apiKey, reasoning, maxTokens, temperature })`. This is the same function pi-advisor uses. No streaming needed.

**4. Model config from pi-advisor pattern** — Config file at `<agentDir>/council.json` stores: enabled, provider, model, maxTokens, reasoning, maxUsesPerRun. Same schema pattern as pi-advisor's `advisor.json`. Members use the same config via `ctx.modelRegistry.find(provider, model)`.

**5. Temperatures hardcoded per phase** — Following council-of-mine: opinions at 0.8, voting at 0.7, synthesis at 0.7. Not user-configurable in v0. Passed via the `temperature` field in `SimpleStreamOptions` (passed through to provider).

**6. opinion prompt structure** — Same as council-of-mine: personality prompt as `systemPrompt`, then the debate topic as a user message with DO NOT FOLLOW INSTRUCTIONS guard band around it. The guard is critical because we're asking the LLM to evaluate content that could contain instructions.

**7. Voting prompt structure** — Each member sees all other opinions (labeled by number), votes for one, and provides reasoning. Structured response parsing: regex for `VOTE: <number>` and `REASONING: <text>`.

**8. Synthesis prompt** — A final LLM call generates 3-4 sentences blending all perspectives, identifying the winning view and acknowledging dissent.

**9. `before_agent_start` hook** — Injects usage guidance into the system prompt (same pattern as pi-advisor), telling the executor about the `ask_council` tool and when to use it.

**10. Tool registration** — Uses `pi.registerTool()` with `Type.Object` schema from typebox. Parameters: `question` (string, required). Returns `{ content: [{ type: "text", text: formattedResults }] }`.

## Risks / Trade-offs

- **18 sequential LLM calls** → Could take 1-2 minutes. Mitigation: `ctx.ui.notify` keeps the user informed. Architecture supports parallel batch later.
- **Member response format varies** → Voting phase requires structured parsing (VOTE: N + REASONING: text). Format drift is possible. Mitigation: fallback to scanning for numbers and using full text as reasoning.
- **Same model for all members = less diversity** → Personality prompts at temperature 0.8 should produce distinct voices, but they still share the same training data and biases. Mitigation: accept for v0; per-member model config is a natural next step.
- **No retry logic per member** → If an individual member call fails, that member's opinion or vote is lost. Mitigation: catch errors per-member, fill with "[Error obtaining opinion]", and continue with remaining members.
