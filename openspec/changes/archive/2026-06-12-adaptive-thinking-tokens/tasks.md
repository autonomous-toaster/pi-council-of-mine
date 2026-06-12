## 1. Core implementation

- [x] 1.1 Add `thinkingTokenBudget()` scaling function (in `src/council.ts`) that maps a `ThinkingLevel` + base tokens → scaled tokens using defined multipliers
- [x] 1.2 Update `DEFAULT_CONFIG.memberMaxTokens` to be optional and use scaling when unset, preserving user override
- [x] 1.3 Bump hardcoded fallback constants: `OPINION_MAX_TOKENS` from 400 → 800, `VOTE_MAX_TOKENS` from 150 → 300
- [x] 1.4 Wire the scaled budgets through `council.ts` — use computed scaled value when no explicit user override exists for `memberMaxTokens`/`memberMaxTokens`
