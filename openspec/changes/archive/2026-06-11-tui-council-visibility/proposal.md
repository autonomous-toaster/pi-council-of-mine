## Why

When the council is invoked from the terminal, the TUI shows only a generic `ask_council` tool call with no indication of the question being debated. There's also no persistent indicator when the council is active (enabled), and no way to see stats (token usage, last winners) at a glance. This makes the council feel invisible — you have to remember to use it or wait for the text output to know what happened.

## What Changes

- **Tool notification shows the question**: `ask_council` calls display the question text in the TUI status area, so you can see what's being debated
- **Persistent status indicator**: A green "Council Active" label appears in the TUI footer when the council is enabled, matching the style of pi-lens's "LSP Active" indicator
- **Stats footer**: After a council debate, the footer updates with real-time stats (token usage, last winners with vote counts) — persisted until the next debate or session end
- **Parallel member execution**: Council members generate opinions using `Promise.all()` for up to 3x speedup, since member calls are independent

## Capabilities

### New Capabilities
- `ask-council-visibility`: TUI notifications showing the question, persistent footer indicator when council is enabled, and stats display (token usage, last winners with vote counts) using `ctx.ui.setStatus()`/`ctx.ui.setFooter()`
- `parallel-council-members`: Parallel execution of independent council member opinion generation using `Promise.all()`

### Modified Capabilities
<!-- No existing main specs to modify. -->

## Impact

- **index.ts**: Add `ctx.ui.setStatus()` calls for persistent "Council Active" indicator; update tool handler to notify with the question
- **src/council.ts**: Pass `memberMaxTokens`/`memberReasoning` through correctly (already done in previous fix); add parallel execution for opinion generation phase
- **src/debate.ts**: Make `generateAllOpinions()` support parallel execution of independent member calls
- No new dependencies. All TUI APIs (`setStatus`, `setFooter`, `notify`) are already part of pi's ExtensionAPI.
