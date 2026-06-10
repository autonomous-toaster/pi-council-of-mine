## Context

The ask_council tool currently executes silently — the TUI shows only the raw tool name with no question preview. There's no persistent indicator when the council is enabled (unlike pi-lens's "LSP Active" footer label), and no post-debate stats displayed at a glance. Council member opinion generation is sequential, adding unnecessary latency since each member call is fully independent.

## Goals / Non-Goals

**Goals:**
- Show the question being debated in the TUI notification during `ask_council` tool execution
- Add a persistent "Council Active" status indicator in the TUI footer when `/council on` is active
- Display post-debate stats (token usage, last winners with vote counts) in the TUI footer until the next debate or session end
- Parallelize independent council member opinion generation for up to 3x speedup

**Non-Goals:**
- Parallel voting phase (members vote on each other's opinions, so sequential is required)
- TUI overlay or dialog for council results (tool output is sufficient)
- Per-member progress bars or fancy animations (simple `ctx.ui.notify` is sufficient)
- Replacing the default pi footer entirely — use `ctx.ui.setStatus()` for the indicator, not `ctx.ui.setFooter()` (simple indicator, not a full footer replacement)

## Decisions

1. **`ctx.ui.setStatus()` over `ctx.ui.setFooter()` for the indicator**: The "Council Active" label is a simple one-line status, not a full footer replacement. `setStatus` is the right API — it's what pi-lens uses for "LSP Active" and it's designed for persistent status indicators. A custom footer would be over-engineered for a single label.

2. **Stats via `ctx.ui.notify()` after debate completes**: Token usage and winners are ephemeral — they're most useful immediately after a debate. A notification fires once and the full results are also in the tool output. A persistent footer stat would stale quickly and requires complex state management. If users want persistent stats later, we can add `setFooter` in a follow-up.

3. **Parallel execution via `Promise.allSettled()`**: Standard concurrency pattern for independent async tasks. Use `allSettled` (not `all`) so one member error doesn't crash the entire council. Failed members get a fallback opinion text.

4. **Configurable concurrency**: Start with unbounded parallelism (all 9 members at once). The pi AI SDK `completeSimple` handles its own request queuing. If users report rate limiting, we can add a `memberConcurrency` config key later.

5. **Question snippet in notification**: Show first 80 chars of question in the initial notification, matching the existing truncation pattern. This gives immediate context without flooding the status area.

## Risks / Trade-offs

- **Rate limiting risk with parallelism**: 9 simultaneous LLM calls may hit API rate limits depending on the provider. Mitigation: start with unbounded parallelism; add configurable concurrency limit if users report issues.
- **Status indicator persistence**: The "Council Active" label persists until `setStatus` is cleared. If the extension is disabled mid-session, the stale label could linger. Mitigation: clear on `council off` command and on session end.
- **Promise.allSettled vs Promise.all**: `allSettled` means a failed member doesn't crash others, but the tool still succeeds. The executor might not notice a missing opinion. Mitigation: count failures and include a warning in the result if too many members failed.
