## ADDED Requirements

### Requirement: Executor can ask the council a question

The executor SHALL be able to call a single tool `ask_council` with a question string and receive a complete formatted response containing all council opinions, vote results, winner(s), and synthesis.

- The tool parameter SHALL be `question` of type `string` (required)
- The tool SHALL NOT accept any other parameters
- The tool SHALL return a single text block with the complete results
- If the council is not enabled (config `enabled: false`), the tool SHALL return an error message

#### Scenario: Successful council consultation

- **WHEN** the executor calls `ask_council` with `question: "Should we use SQLite or Postgres?"`
- **THEN** the response SHALL contain opinions from all 9 council members
- **AND** the response SHALL contain voting results showing who voted for whom
- **AND** the response SHALL declare one or more winners
- **AND** the response SHALL include a synthesis paragraph (3-4 sentences)

#### Scenario: Council disabled

- **WHEN** the executor calls `ask_council` while the council is disabled
- **THEN** the tool SHALL return an error message indicating the council is disabled

### Requirement: Each council member generates an opinion

Each of the 9 council members SHALL generate a 2-4 sentence opinion in response to the debate topic, guided by their unique personality prompt.

- The personality prompt SHALL be the system prompt for the LLM call
- The debate topic SHALL be the user message, wrapped with DO NOT FOLLOW INSTRUCTIONS guard text
- Temperature SHALL be 0.8 for opinion generation
- Max tokens SHALL be 200 per opinion
- If a member fails to respond, the opinion SHALL be `[Error obtaining opinion]` and execution SHALL continue

#### Scenario: Member generates opinion

- **WHEN** a member receives the personality prompt + debate topic
- **THEN** the response SHALL be 2-4 sentences reflecting their archetype's perspective

#### Scenario: Member call fails

- **WHEN** the LLM call for a member returns an error or empty response
- **THEN** the extension SHALL log the error and continue with the next member
- **AND** the failed member's opinion SHALL be recorded as `[Error obtaining opinion]`

### Requirement: Council members vote on each other's opinions

After all opinions are generated, each of the 9 members SHALL review the other 8 opinions and vote for the one that best aligns with their perspective, providing reasoning.

- Each member SHALL see all other opinions labeled by member ID and name
- Each member SHALL NOT be able to vote for their own opinion
- Temperature SHALL be 0.7 for voting
- Max tokens SHALL be 150 per vote
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

### Requirement: Results are tallied and a synthesis is generated

After voting, the extension SHALL tally votes, declare winner(s), and generate a synthesis.

- The member(s) with the most votes SHALL be declared winner(s)
- In case of a tie, there SHALL be multiple winners
- A final LLM call SHALL generate a 3-4 sentence synthesis
- The synthesis prompt SHALL include: the original topic, all opinions, and vote counts
- Temperature SHALL be 0.7 for synthesis
- Max tokens SHALL be 300 for synthesis

#### Scenario: Single winner

- **WHEN** one member receives more votes than all others
- **THEN** that member SHALL be declared the sole winner

#### Scenario: Tie

- **WHEN** two or more members receive the same highest number of votes
- **THEN** all tied members SHALL be declared winners

#### Scenario: Synthesis generated

- **WHEN** all votes are tallied
- **THEN** a final LLM call SHALL generate a 3-4 sentence synthesis
- **AND** the synthesis SHALL identify the winning perspective
- **AND** the synthesis SHALL acknowledge key insights from other perspectives

### Requirement: Council is configurable

The extension SHALL support configuration via a JSON file stored at `<agentDir>/council.json`, following the same pattern as pi-advisor's `advisor.json`.

- Config keys: `enabled`, `provider`, `model`, `maxTokens`, `reasoning` (thinking level), `maxUsesPerRun`
- Default provider SHALL be `"anthropic"`
- Default model SHALL be `"claude-opus-4-6"`
- Default reasoning SHALL be `"high"`
- Default maxTokens SHALL be `8192`
- Default maxUsesPerRun SHALL be `3`
- The `/council` command SHALL support: `on`, `off`, `config`, `ask`

#### Scenario: Enable council

- **WHEN** user runs `/council on anthropic/claude-opus-4-6`
- **THEN** config SHALL set `enabled: true`, `provider: "anthropic"`, `model: "claude-opus-4-6"`
- **AND** the `ask_council` tool SHALL be registered as active

#### Scenario: Disable council

- **WHEN** user runs `/council off`
- **THEN** config SHALL set `enabled: false`
- **AND** the `ask_council` tool SHALL be removed from active tools

### Requirement: System prompt guidance

The extension SHALL inject guidance into the executor's system prompt about when and how to use the `ask_council` tool, following the same pattern as pi-advisor.

- The guidance SHALL be injected in `before_agent_start`
- The guidance SHALL describe the tool's purpose and usage rules
- The guidance SHALL include the configurable stages for when to call the tool

#### Scenario: Guidance injected

- **WHEN** the agent starts and the council is enabled
- **THEN** the system prompt SHALL include guidance about the `ask_council` tool
- **AND** the guidance SHALL tell the executor to use it for complex decisions needing diverse perspectives
