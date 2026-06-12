## Why

When `memberReasoning` is enabled, the council's `maxTokens` budget (400 for opinions, 150 for votes) is shared between thinking blocks and text output. The model spends most tokens thinking, leaving only ~50-100 tokens for the actual opinion text — severely truncating responses. The defaults need to scale proportionally to the thinking level.

## What Changes

- Make `memberMaxTokens` default adaptive to the configured `memberReasoning` level (off=400, minimal=800, low=1200, medium=2000, high=4000, xhigh=8000)
- Make voting member token budget adaptive the same way (same scaling but starting from 150 base)
- Increase the internal hardcoded fallback constants in `debate.ts` and `voting.ts` to match
- No changes to the display-side truncation (cosmetic only, full text preserved in data)

## Capabilities

### New Capabilities
- `adaptive-token-budget`: Token budget scaling based on reasoning level for council member opinion generation and voting

### Modified Capabilities

None.

## Impact

- `index.ts`: Update `DEFAULT_CONFIG.memberMaxTokens` and `DEFAULT_CONFIG.memberMaxTokens` — change from single number to a scaling function
- `src/council.ts`: Pass computed token budgets based on thinking level
- `src/debate.ts`: Increase `OPINION_MAX_TOKENS` fallback
- `src/voting.ts`: Increase `VOTE_MAX_TOKENS` fallback
- `src/results.ts`: Potentially adjust `SYNTHESIS_MAX_TOKENS` fallback
