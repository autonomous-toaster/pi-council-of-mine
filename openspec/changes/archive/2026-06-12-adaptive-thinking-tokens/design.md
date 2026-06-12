## Context

When `memberReasoning` is set, `completeSimple` passes `maxTokens` and `reasoning` to the provider. The `maxTokens` budget covers **both** thinking blocks and text output. With small budgets (400 for opinions, 150 for votes), the text output after thinking is severely truncated.

The council currently has:
- Hardcoded fallback constants in `debate.ts` (`OPINION_MAX_TOKENS = 400`), `voting.ts` (`VOTE_MAX_TOKENS = 150`), `results.ts` (`SYNTHESIS_MAX_TOKENS = 300`)
- A config default `memberMaxTokens: 400` in `index.ts`
- No `thinkingBudgets` passed to `completeSimple`

## Goals / Non-Goals

**Goals:**
- Scale `memberMaxTokens` for opinions based on the `memberReasoning` level
- Scale voting tokens similarly
- Preserve backward compatibility: `off` level keeps 400/150 defaults
- Support explicit user override via config (override > auto-scale)

**Non-Goals:**
- Passing `thinkingBudgets` to `completeSimple` (pi's SimpleStreamOptions supports it, but this is an additive improvement, not required for the fix)
- Changing the synthesis token budget (300 is a hard limit for a "3-4 sentence" summary)
- Changing the display-side truncation in `formatCompactCouncilResults`

## Decisions

### 1. Scaling function location: shared module

**Decision**: Add a `thinkingTokenBudget(reasoningLevel, baseTokens)` function exported from a shared location (e.g., `src/council.ts` or a new `src/tokens.ts`).

**Rationale**: Both `index.ts` (config defaults) and `src/council.ts` (which builds the config for each phase) need access to the scaling logic. Defining it once avoids duplication.

### 2. Scaling factor: linear multiplier

**Decision**: Each thinking level maps to a multiplier applied to the base tokens:

| Level    | Multiplier | Opinion budget | Vote budget |
|----------|-----------|----------------|-------------|
| off      | 1×        | 400            | 150         |
| minimal  | 2×        | 800            | 300         |
| low      | 3×        | 1200           | 500         |
| medium   | 5×        | 2000           | 800         |
| high     | 10×       | 4000           | 1500        |
| xhigh    | 20×       | 8000           | 3000        |

**Rationale**: These multipliers are heuristics based on typical thinking token consumption. With `xhigh`, a model might use 6000+ tokens thinking — 8000 gives it room.

### 3. User override takes precedence

**Decision**: If the user explicitly sets `memberMaxTokens` or `memberMaxTokens` in config, the auto-scaling is bypassed entirely.

**Rationale**: An explicit config value is a deliberate choice. The user set it for a reason. Auto-scaling on top would be confusing.

### 4. Hardcoded fallbacks updated

**Decision**: Bump `OPINION_MAX_TOKENS` to 800 and `VOTE_MAX_TOKENS` to 300 as the last-resort fallbacks.

**Rationale**: Even without reasoning, 400 feels tight for 2-4 sentences. 800 still forces conciseness while preventing truncation. The config default will also change to 800 for `off`.

### 5. Synthesis left at 300

**Decision**: Synthesis budget stays at 300.

**Rationale**: The synthesis prompt instructs "3-4 sentences." 300 tokens is tight but intentional — the synthesis should be concise, not discursive. If reasoning is enabled, it needs room for thinking too, but the synthesis is the least sensitive to truncation (even a partial 2-sentence synthesis is useful).

## Risks / Trade-offs

- **[Higher token costs]**: Scaling budgets by up to 20× increases council cost proportionally. → Mitigation: only applies when `memberReasoning` is explicitly set (default is `off`, no cost change). Users pay more for thinking capability.
- **[Oversized responses]**: Higher budgets might cause verbose opinions. → Intent of the system. The prompt already says "2-4 sentences" — budget increase enables completion, not verbosity.
- **[Model maxTokens limits]**: Some models have low `maxTokens` (< 4000). → The function stays within model constraints implicitly — `completeSimple` caps at model's `maxTokens` anyway.
