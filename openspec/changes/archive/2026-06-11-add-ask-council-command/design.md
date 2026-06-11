## Context

The Council of Mine extension (`index.ts`) currently has:
- A `/council` command with subcommands `on`, `off`, `config` for managing the tool
- An `ask_council` LLM tool registered for the AI executor

The debate engine (`runCouncilDebate` in `src/council.ts`) is already a standalone function that accepts a model, question, and config. The tool's execute handler wraps it with tool-specific logic (usage tracking, rendering).

Adding a user command means calling the same `runCouncilDebate` from a command handler path instead of a tool execute path. The output format should be optimized for human reading rather than AI context consumption.

## Goals / Non-Goals

**Goals:**
- Add `/council ask <question>` subcommand accessible from the user's terminal
- Reuse the full `runCouncilDebate` debate engine without modification
- Produce a compact, terminal-friendly output format
- Show live progress notifications during debate phases
- Work independently of tool enable/disable state

**Non-Goals:**
- Changing the existing `ask_council` tool behavior or format
- Adding inline model overrides to the command (uses configured model)
- Adding streaming or progressive output rendering (all results at once)
- Adding new debate phases or modifying council member personalities

## Decisions

### 1. Subcommand vs dedicated command
**Decision**: Subcommand under `/council` — `/council ask <question>`
**Rationale**: `/council` is already the namespace for this extension. Keeps command space clean. `/council ask` reads naturally and parallels existing subcommands (`/council on`, `/council config`).

### 2. Works when tool is disabled
**Decision**: The command is NOT gated by the `enabled` config flag
**Rationale**: `enabled` controls the AI executor's tool, not the user's ability to invoke the council. The user controls the invocation. This is an explicit design choice — the user might want a quick council consultation without the AI being able to call the council autonomously.

### 3. Compact output format
**Decision**: A new compact formatter, separate from the tool's verbose `formatCouncilResults`
**Rationale**: The tool format is designed for AI consumption (80-char separators, verbose sections). The user format should be scannable in a terminal. Creating a separate function avoids coupling the two display paths.

### 4. Progress via notifications, not streaming
**Decision**: Use `ctx.ui.notify` for progress, return all results at once
**Rationale**: `ctx.ui.notify` is the established pattern in the existing extension (the tool already uses it). Streaming partial output into a command result is more complex and doesn't add much value — the debate takes a few seconds.

### 5. Uses configured model
**Decision**: The command reuses the same `config.provider`/`config.model` as the tool
**Rationale**: Simplicity. The user configures the council model once. No inline model overrides.

## Risks / Trade-offs

- **[Duplicate invocation]**: User could run `/council ask` at the same time the AI calls `ask_council` tool. → Low risk, each call is independent with its own config and token tracking. The tool's `usesThisRun` counter is separate.
- **[Long wait with unclear progress]**: Council debate takes 10-20 seconds. → Mitigated by live `ctx.ui.notify` progress for each phase.
- **[Token cost surprise]**: User might not expect the cost of 9+ LLM calls. → Mitigated by the `/council config` display showing the model and member token settings. Token usage shown in output footer.
