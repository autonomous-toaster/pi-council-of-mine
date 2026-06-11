## 1. Command handler — `/council ask`

- [x] 1.1 Add `"ask"` subcommand handler in the `/council` command's switch statement, parsing everything after `ask ` as the question
- [x] 1.2 Handle empty question case with a usage hint
- [x] 1.3 Reuse `runCouncilDebate()` directly (not through the tool), passing the configured model and config
- [x] 1.4 Wire up `ctx.ui.notify` progress callbacks for each phase (opinions, voting, synthesis, completion)
- [x] 1.5 Handle error cases: model not found, no API key, debate failure

## 2. Compact output formatting

- [x] 2.1 Create a compact formatter function (in `texts.ts` or inline) that produces a terminal-friendly summary with one-line opinions, vote tally, winner, synthesis, and token usage
- [x] 2.2 Wire it into the command handler's return path
