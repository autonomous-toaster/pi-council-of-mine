## ADDED Requirements

### Requirement: Member-specific prompt configuration

The council SHALL support separate configuration for member prompts, distinct from the executor-facing configuration.

- Config keys: `memberMaxTokens` (number), `memberReasoning` (thinking level)
- Default `memberMaxTokens` SHALL be 400
- Default `memberReasoning` SHALL be `"off"`
- These keys SHALL be stored in the same `council.json` config file
- They SHALL be read-only from the perspective of the `ask_council` tool (tool does not accept them as parameters)
- They SHALL be configurable via `/council config memberMaxTokens=500` and `/council config memberReasoning=low`

#### Scenario: Default member config applied

- **WHEN** a council debate runs with no explicit member config in `council.json`
- **THEN** members SHALL use `memberMaxTokens=400` and `memberReasoning="off"`

#### Scenario: Custom member reasoning

- **WHEN** user runs `/council config memberReasoning=low`
- **THEN** subsequent council debates SHALL use `reasoning: "low"` for member calls
- **AND** the executor's general `reasoning` config SHALL remain unchanged

#### Scenario: Custom member tokens

- **WHEN** user runs `/council config memberMaxTokens=800`
- **THEN** subsequent council debates SHALL use `maxTokens: 800` for member calls
- **AND** the general `maxTokens` SHALL remain unchanged
