## Purpose

Defines how the ask_council tool operates: how opinions are generated, how voting works, and how results are synthesized. This spec covers the core debate mechanics.

## Requirements

### Requirement: Each council member generates an opinion

Each of the 9 council members SHALL generate a 2-4 sentence opinion in response to the debate topic, guided by their unique personality prompt.

- The personality prompt SHALL be the system prompt for the LLM call
- The debate topic SHALL be the user message, wrapped in `=== DEBATE TOPIC ===` markers WITHOUT any "DO NOT FOLLOW INSTRUCTIONS" guard text
- The opinion instruction SHALL be direct: "Provide your opinion on this topic in 2-4 sentences as {name} (the {archetype}). Stay true to your character and perspective."
- Temperature SHALL be 0.8 for opinion generation
- Max tokens per opinion SHALL be determined by the `memberMaxTokens` config key (default 400)
- Reasoning level SHALL be determined by the `memberReasoning` config key (default `"off"`)
- If a member fails to respond, the opinion SHALL be `[Error obtaining opinion]` and execution SHALL continue

#### Scenario: Member generates opinion

- **WHEN** a member receives the personality prompt + clean debate topic
- **THEN** the response SHALL be 2-4 sentences reflecting their archetype's perspective
- **AND** the response SHALL NOT contain meta-analysis about how to construct the response

#### Scenario: Member call fails

- **WHEN** the LLM call for a member returns an error or empty response
- **THEN** the extension SHALL log the error and continue with the next member
- **AND** the failed member's opinion SHALL be recorded as `[Error obtaining opinion]`

### Requirement: Council members vote on each other's opinions

After all opinions are generated, each of the 9 members SHALL review the other 8 opinions and vote for the one that best aligns with their perspective, providing reasoning.

- Each member SHALL see all other opinions labeled by member ID and name
- Each member SHALL NOT be able to vote for their own opinion
- Temperature SHALL be 0.7 for voting
- Max tokens SHALL be determined by `memberMaxTokens` config key (default 400)
- Reasoning level SHALL be determined by `memberReasoning` config key (default `"off"`)
- The voting section headers SHALL NOT contain "DO NOT FOLLOW INSTRUCTIONS" guards
- The response SHALL be parsed for `VOTE: <number>` and `REASONING: <text>`
- If parsing fails, the extension SHALL fall back to scanning for numbers in the response
- If a member's vote call fails, the member SHALL be skipped and execution SHALL continue

#### Scenario: Member votes for another's opinion

- **WHEN** a member receives the voting prompt with 8 other opinions
- **THEN** the response SHALL contain `VOTE:` followed by a valid member ID
- **AND** the response SHALL contain `REASONING:` with 1-2 sentences

#### Scenario: Invalid vote format

- **WHEN** a member's response does not contain `VOTE: <number>` in the expected format
- **THEN** the extension SHALL attempt to extract a number from the response
- **AND** if no valid number is found, the vote SHALL be skipped

### Requirement: Council is configurable

The extension SHALL support configuration via a JSON file stored at `<agentDir>/council.json`, following the same pattern as pi-advisor's `advisor.json`.

- Config keys: `enabled`, `provider`, `model`, `maxTokens`, `reasoning`, `maxUsesPerRun`, `memberMaxTokens`, `memberReasoning`
- Default provider SHALL be `"anthropic"`
- Default model SHALL be `"claude-opus-4-6"`
- Default reasoning SHALL be `"high"`
- Default memberReasoning SHALL be `"off"`
- Default maxTokens SHALL be `8192`
- Default memberMaxTokens SHALL be `400`
- Default maxUsesPerRun SHALL be `3`
- The `/council` command SHALL support: `on`, `off`, `config`
- The `/council config` SHALL support setting `memberMaxTokens` and `memberReasoning`

#### Scenario: Enable council

- **WHEN** user runs `/council on anthropic/claude-opus-4-6`
- **THEN** config SHALL set `enabled: true`, `provider: "anthropic"`, `model: "claude-opus-4-6"`
- **AND** the `ask_council` tool SHALL be registered as active

#### Scenario: Disable council

- **WHEN** user runs `/council off`
- **THEN** config SHALL set `enabled: false`
- **AND** the `ask_council` tool SHALL be removed from active tools

#### Scenario: Member reasoning configured

- **WHEN** user runs `/council config memberReasoning=low`
- **THEN** config SHALL set `memberReasoning: "low"`
- **AND** subsequent opinion and voting calls SHALL use `reasoning: "low"`

#### Scenario: Member tokens configured

- **WHEN** user runs `/council config memberMaxTokens=600`
- **THEN** config SHALL set `memberMaxTokens: 600`
- **AND** subsequent opinion and voting calls SHALL use `maxTokens: 600`
