## Why

The ask_council tool shows no inline question preview in the TUI tool row, and voting runs sequentially — adding unnecessary latency since each member votes independently. Adding `renderCall`/`renderResult` makes the council visible inline, and parallel voting with configurable concurrency cuts total debate time by ~3x.

## What Changes

- **renderCall**: Shows truncated question inline in the TUI tool row when the executor calls `ask_council`
- **renderResult**: Shows winner + token count compact summary in the tool row after debate completes (full output still available on expand)
- **Post-debate footer**: Updates the "Council Active" status in the lower bar to show last winners and vote counts after each debate
- **Parallel voting**: Changes `conductVoting()` from sequential `for...of` to `Promise.allSettled()` — same pattern as opinions
- **Configurable concurrency**: New `memberConcurrency` config key (default: 3) limits simultaneous LLM calls during both opinion and voting phases, preventing rate limit errors

## Capabilities

### New Capabilities
- `council-inline-rendering`: `renderCall` and `renderResult` for the ask_council tool, showing question preview and compact results in the TUI tool row
- `parallel-voting`: Parallel execution of council member voting phase using configurable concurrency, matching the existing parallel-opinions pattern

### Modified Capabilities
<!-- No existing main specs to modify. -->

## Impact

- **index.ts**: Add `renderCall`/`renderResult` to the tool definition; add `memberConcurrency` to interface, defaults, config loading, command handler, display; update post-debate notification to also update footer status; pass `memberConcurrency` to `runCouncilDebate`
- **src/council.ts**: Accept `memberConcurrency` config and pass to both opinion and voting phases
- **src/debate.ts**: Update `generateAllOpinions` to accept and use a concurrency limiter for batched parallel execution
- **src/voting.ts**: Change `conductVoting` to use `Promise.allSettled()` with concurrency batching instead of sequential `for...of`
