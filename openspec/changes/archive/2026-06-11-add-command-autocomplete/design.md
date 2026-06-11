## Context

The `/council` command is registered in `index.ts` via `pi.registerCommand("council", ...)`. The `registerCommand` API supports an optional `getArgumentCompletions(prefix: string): AutocompleteItem[] | null` that pi's TUI calls on TAB press after the command name.

The function receives the full text after `/council ` — it must parse the prefix to determine which subcommand was typed and return relevant completions. Completions that don't match the prefix are filtered by the TUI internally.

## Goals / Non-Goals

**Goals:**
- Add tab-completion for `/council` subcommands (`on`, `off`, `ask`, `config`) on the first argument
- Add tab-completion for config keys (`provider=`, `model=`, etc.) on the second argument after `/council config`
- Completions filtered by prefix

**Non-Goals:**
- Completions for dynamic values (provider/model names from registry, etc.)
- Completions for `/council on` provider/model arguments
- Modifying command behavior, output, or configuration storage

## Decisions

### 1. Static completion lists

**Decision**: Use static lists for subcommands and config keys. The subcommand set is fixed by the switch statement. The config keys are fixed by the keys supported in `/council config`.

**Rationale**: Dynamic completions (e.g., provider/model from registry) would require async access to `ctx.modelRegistry`, which isn't available in `getArgumentCompletions` (it only receives the prefix string). Static lists cover the most common use cases.

### 2. Config keys include `=` suffix

**Decision**: Config key completions append `=` (e.g., `provider=` not just `provider`).

**Rationale**: After selecting a config key, the user naturally types a value. The `=` signals that a value is expected and matches the `key=value` format already required by `/council config`.

### 3. Return null on no match

**Decision**: Return `null` (not empty array) when no completions match the prefix.

**Rationale**: pi's TUI treats `null` as "no completion provider for this context" and may fall back to file completion (if applicable). An empty array means "there are completions but none match" which suppresses fallback. For `/council ask`, the user types free-form text and we want to allow file completion fallback.

## Risks / Trade-offs

- **[No model/provider completions]**: Users won't get tab-completion for model names in `/council on`. → Low impact, model names are typically short and memorized. Can be added later with async support.
- **[Over-eager completions]**: Typing `/council ask` shows no completions (correct). Typing `/council ask config` also shows no completions since `ask` is the subcommand. → Correct behavior.
