## Why

The `/council` command has multiple subcommands (`on`, `off`, `ask`, `config`) with structured arguments. Currently there's no tab-completion — the user must type everything from memory. Adding auto-completion via pi's built-in `getArgumentCompletions` makes the council extension feel polished and discoverable.

## What Changes

- Add `getArgumentCompletions` to the existing `pi.registerCommand("council", ...)` call
- Complete subcommand names for the first argument: `on`, `off`, `ask`, `config`
- Complete config key names for the second argument after `/council config`: `provider=`, `model=`, `maxTokens=`, `reasoning=`, `maxUsesPerRun=`, `memberMaxTokens=`, `memberReasoning=`, `memberConcurrency=`
- No changes to command behavior, output format, or configuration

## Capabilities

### New Capabilities
- `command-autocomplete`: Tab-completion for `/council` command arguments — subcommands and config keys

### Modified Capabilities

None.

## Impact

- `index.ts`: Add `getArgumentCompletions` option to the existing `pi.registerCommand("council", ...)` call, parse the prefix to determine completion context, return `AutocompleteItem[]`
