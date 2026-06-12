## ADDED Requirements

### Requirement: Token budget scales with reasoning level

The system SHALL adapt the `maxTokens` for council member opinions and votes based on the configured `memberReasoning` level, ensuring sufficient token budget for both thinking and text output.

The system SHALL define a mapping from each thinking level to a proportional token budget for opinion generation:
- `off`: 400 tokens
- `minimal`: 800 tokens
- `low`: 1200 tokens
- `medium`: 2000 tokens
- `high`: 4000 tokens
- `xhigh`: 8000 tokens

The system SHALL define a mapping from each thinking level to a proportional token budget for voting:
- `off`: 150 tokens
- `minimal`: 300 tokens
- `low`: 500 tokens
- `medium`: 800 tokens
- `high`: 1500 tokens
- `xhigh`: 3000 tokens

#### Scenario: Default config with reasoning off

- **WHEN** `memberReasoning` is `"off"` (default)
- **THEN** opinion `maxTokens` defaults to 400
- **THEN** vote `maxTokens` defaults to 150
- **THEN** the current behavior is preserved

#### Scenario: Reasoning enabled with medium level

- **WHEN** `memberReasoning` is `"medium"`
- **THEN** opinion `maxTokens` SHALL default to 2000 (400 base × 5x for medium)
- **THEN** vote `maxTokens` SHALL default to 800

#### Scenario: User override via config

- **WHEN** user explicitly sets `memberMaxTokens=1000` via `/council config memberMaxTokens=1000`
- **THEN** the explicit value SHALL be used instead of the auto-scaled default
- **THEN** the adaptive scaling SHALL NOT apply
