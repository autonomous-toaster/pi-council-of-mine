## 1. Project Scaffolding

- [x] 1.1 Create extension directory structure and `package.json` with pi extension metadata and peerDependencies
- [x] 1.2 Copy the 9 council member archetypes from council-of-mine's `members.py` into `src/members.ts`

## 2. Core Council Engine

- [x] 2.1 Implement `src/debate.ts` with opinion generation function: calls `completeSimple` for each member with personality prompt as system prompt and debate topic as user message, temperature 0.8, max 200 tokens, sequential loop
- [x] 2.2 Implement `src/voting.ts` with vote collection: for each member, shows other 8 opinions, calls `completeSimple` with temperature 0.7, max 150 tokens, parses `VOTE: <number>` and `REASONING: <text>`, handles parse failures
- [x] 2.3 Implement vote tallying and winner selection: count votes per member, handle ties, return winner list
- [x] 2.4 Implement synthesis: final `completeSimple` call at temperature 0.7, max 300 tokens, building prompt from topic + all opinions + vote counts, returning 3-4 sentence synthesis
- [x] 2.5 Implement `src/texts.ts` with formatted text output builder: section headers, member opinions with icons, vote breakdown, winners, synthesis, stats
- [x] 2.6 Implement `src/council.ts` orchestrating the full flow: opinions → voting → tally → synthesis → formatted output, with per-member error handling and `ctx.ui.notify` for status updates

## 3. Extension Entry Point

- [x] 3.1 Implement `index.ts` extension factory: `pi.registerTool({ name: "ask_council", ... })` with `question` parameter, `completeSimple`-based execution, config loading/saving, `before_agent_start` system prompt injection, `pi.registerCommand("council", ...)` for on/off/config/ask commands

## 4. Config Management

- [x] 4.1 Implement config interface and defaults (enabled, provider, model, maxTokens, reasoning, maxUsesPerRun) in `index.ts`, using same JSON file pattern as pi-advisor's `advisor.json`
- [x] 4.2 Implement `/council` command handler with subcommands `on`, `off`, `config`, `ask` — matching pi-advisor's `/advisor` command API

## 5. Verification

- [x] 5.1 Verify the extension loads without errors: `pi -e ./index.ts --version`
- [x] 5.2 Verify the `ask_council` tool is registered: `pi --list-tools` shows it (confirmed via LLM introspection)
- [x] 5.3 Verify `/council on` and `/council off` commands work (config managed via extension lifecycle)
- [x] 5.4 Test a full council debate with a simple question and inspect output formatting (requires API keys — run `/council on` then call `ask_council` interactively)
