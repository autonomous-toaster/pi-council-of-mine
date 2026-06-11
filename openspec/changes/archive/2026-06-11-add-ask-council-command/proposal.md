## Why

The Council of Mine is currently only accessible to the AI executor via the `ask_council` tool. The human user has no way to invoke the council directly — they must ask the AI to do it. Adding a `/council ask "question"` command gives the user direct access to the council for independent consultation, without going through the executor.

This is especially valuable when:
- The user wants a quick second opinion without framing it as part of a task
- The user wants to explore a question privately before engaging the executor
- The user wants to keep the council's advice separate from the agent's context

## What Changes

- Add `/council ask <question>` subcommand to invoke the council from the user's terminal
- Works independently of the tool being enabled/disabled
- Reuses the existing debate engine (`runCouncilDebate`)
- Produces a compact, human-friendly output format instead of the verbose tool format
- Shows live progress notifications as opinions and votes arrive

## Capabilities

### New Capabilities
- `user-council-invocation`: Direct user-initiated council invocation via the `/council ask` command, with compact formatting and progress display

### Modified Capabilities

None. The existing `ask_council` tool is unchanged.

## Impact

- `index.ts`: New `"ask"` subcommand handler in the existing `/council` command
- `src/texts.ts`: New compact output formatter (or inline formatting in command handler)
- No changes to debate engine, members, voting, or results modules
