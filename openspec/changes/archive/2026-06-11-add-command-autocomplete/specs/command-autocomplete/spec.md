## ADDED Requirements

### Requirement: Subcommand name completion

The system SHALL provide tab-completion for the first argument of `/council`, suggesting matching subcommand names.

The completions SHALL include:
- `on`
- `off`
- `ask`
- `config`

Completions SHALL be filtered by prefix. When the prefix matches nothing, return null (no suggestions).

#### Scenario: Typing partial subcommand

- **WHEN** user types `/council o` and presses TAB
- **THEN** the system suggests `on` and `off`

#### Scenario: Typing full subcommand

- **WHEN** user types `/council ask` and presses TAB
- **THEN** the system shows no suggestions (exact match already typed)

#### Scenario: No matching subcommand

- **WHEN** user types `/council x` and presses TAB
- **THEN** the system shows no suggestions

### Requirement: Config key completion

The system SHALL provide tab-completion for arguments after `/council config`, suggesting config key names.

The completions SHALL include:
- `provider=`
- `model=`
- `maxTokens=`
- `reasoning=`
- `maxUsesPerRun=`
- `memberMaxTokens=`
- `memberReasoning=`
- `memberConcurrency=`

Completions SHALL be filtered by prefix.

#### Scenario: Typing partial config key

- **WHEN** user types `/council config m` and presses TAB
- **THEN** the system suggests `model=` and `maxTokens=`

#### Scenario: No argument after subcommand

- **WHEN** user types `/council config ` (with trailing space) and presses TAB
- **THEN** the system shows all config key completions
