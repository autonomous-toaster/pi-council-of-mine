## 1. Config — Member Concurrency

- [x] 1.1 Add `memberConcurrency` to `CouncilConfig` interface in `index.ts` with default of 3
- [x] 1.2 Add `memberConcurrency` to config loading/saving with type validation (must be integer >= 1)
- [x] 1.3 Add `memberConcurrency` to `/council config` command handler (set and display)
- [x] 1.4 Add `memberConcurrency` to `CouncilConfig` in `src/council.ts` and pass through to opinion + voting configs

## 2. Inline Rendering — renderCall + renderResult

- [x] 2.1 Add `renderCall` to the `ask_council` tool definition showing the truncated question (max ~120 chars with "...") as a `Text` component
- [x] 2.2 Add `renderResult` to the `ask_council` tool definition showing compact winner + token summary when collapsed, full formatted output when expanded

## 3. Parallel Voting + Concurrency Batching

- [x] 3.1 Extract a helper function `batchPromises<T>`... as `batchMap` in `src/batch.ts`
- [x] 3.2 Update `src/debate.ts` `generateAllOpinions()` to use `batchMap` with `memberConcurrency`
- [x] 3.3 Update `src/voting.ts` `conductVoting()` to use `batchMap` with `memberConcurrency` for parallel execution instead of sequential `for...of`
