## Why

The pi coding agent currently has a "single advisor" pattern (pi-advisor) that consults one stronger model for strategic guidance. But complex decisions benefit from diverse perspectives, debate, and democratic voting — not just a single opinion. A "council of minds" with distinct archetypes can provide richer, more nuanced advice by debating questions from multiple angles and voting on the best answer.

This extension brings the proven council-of-mine (MCP server) pattern directly into pi as a native TypeScript extension — no MCP infrastructure needed, no Python dependency, and configurable like pi-advisor.

## What Changes

- New pi extension `pi-council-of-mine` in this repo
- Registers a single LLM-callable tool `ask_council`
- The executor asks one question and receives a complete response: all 9 opinions, vote breakdown, winner(s), and synthesis
- Same 9 archetypal council members as council-of-mine (Pragmatist, Visionary, Systems Thinker, Optimist, Devil's Advocate, Mediator, User Advocate, Traditionalist, Analyst)
- Same personality prompts, same opinion + voting + synthesis flow
- Council members have no tools or skills — pure text generation via completeSimple
- Configurable like pi-advisor: provider, model, thinking level, maxTokens (all members share same config in v0)
- Sequential execution (architected to support parallel later)
- `/council` command for manual triggering and configuration
- Minimal TUI — ctx.ui.notify status updates only

## Capabilities

### New Capabilities
- `ask-council`: Core capability — executor calls a single tool with a question and receives opinions from all 9 council members, voting results with reasoning, winner(s) announcement, and a balanced synthesis. Configurable provider/model/thinking/temperature settings.

### Modified Capabilities

## Impact

- New code only (no existing code modified)
- Depends on pi's ModelRegistry and `completeSimple` from `@earendil-works/pi-ai`
- Extends `pi-coding-agent` via standard extension API (no MCP dependencies)
- All 9 members use the same model config in v0; per-member config is a future evolution
