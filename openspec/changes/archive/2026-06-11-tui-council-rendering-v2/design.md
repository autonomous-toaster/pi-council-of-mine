## Context

The ask_council tool currently has no `renderCall` or `renderResult`, so pi's default rendering shows only the tool name with no question context. The voting phase (added in `pi-council-extension`) is sequential, adding ~9× latency to total debate time. A configurable `memberConcurrency` was proposed in the `tui-council-visibility` design but deferred.

## Goals / Non-Goals

**Goals:**
- Show truncated question inline via `renderCall` — simple `Text` component, ~80-120 char truncation
- Show winner + token summary via `renderResult` — compact collapsed, full output expanded
- Update footer status after each debate from "Council Active" → "Council: WinnerName(Nv)"
- Parallelize voting phase with `Promise.allSettled()` matching the opinion pattern
- Add `memberConcurrency` config key (default: 3) with validation and display

**Non-Goals:**
- Fancy live-updating progress in the tool row during execution (keep using `ctx.ui.notify()` for that)
- Full footer replacement via `setFooter()` — keep using `setStatus()` for the council indicator
- Per-provider concurrency limits — single global `memberConcurrency`

## Decisions

1. **renderCall via simple Text component**: Reuse `context.lastComponent` pattern. Just one line: `toolTitle("ask_council") + question truncated`. No background box or framing — keep it minimal like the built-in `todo` tool.

2. **renderResult: collapsed vs expanded**: Collapsed shows winner line + token count. When expanded, show the full `result.formatted` output as a `Text` component. This matches how built-in tools like `read` work.

3. **Concurrency batching via simple async pattern**: Use an async batch function that dispatches `Math.min(concurrency, remaining)` calls at a time. Not a full task queue — just a `while` loop with `Promise.allSettled` on batches. Simple, no dependencies.

4. **memberConcurrency applies to BOTH opinions and voting**: The same limit controls how many simultaneous `completeSimple` calls are made during each phase. This prevents burst rate limiting on both sides.

5. **Footer update uses setStatus**: After debate, replace the static "Council Active" with a dynamic "Council: Winner(Nv)" text. The green coloring stays. This is simpler than setFooter and preserves pi's default footer.

## Risks / Trade-offs

- **Concurrency default of 3 may be too conservative** for power users on Anthropic/OpenAI API. Mitigation: easy to override via `/council config memberConcurrency=9`.
- **renderResult showing formatted output on expand**: The full output is ~100 lines with all opinions. This might feel too verbose for the tool row. Mitigation: could truncate to first 10 lines + "..." on expand, but let's start with full output and adjust.
- **Parallel voting with concurrency**: If a member fails during voting, their vote is silently skipped. The tally already handles missing votes gracefully, so no crash risk.
