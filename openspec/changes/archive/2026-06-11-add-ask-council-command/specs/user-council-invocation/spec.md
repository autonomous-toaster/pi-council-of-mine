## ADDED Requirements

### Requirement: User invokes council via `/council ask`

The system SHALL provide a `/council ask <question>` command that allows the human user to directly invoke the Council of Mine debate engine.

- The command SHALL parse everything after `/council ask ` as the question
- The command SHALL work regardless of whether the `ask_council` tool is enabled or disabled
- The command SHALL use the currently configured council model (provider/model from `/council config`)
- The command SHALL display live progress notifications as each council member generates their opinion and casts their vote

#### Scenario: Successful council invocation

- **WHEN** user types `/council ask Should I use SQLite or PostgreSQL?`
- **THEN** the system runs the full debate (opinions → voting → tally → synthesis)
- **THEN** the system displays a compact formatted result in the user's terminal

#### Scenario: Council invoked while tool is disabled

- **WHEN** user has run `/council off` (tool disabled)
- **WHEN** user types `/council ask What is the best approach for X?`
- **THEN** the council debate runs normally
- **THEN** results are displayed to the user

#### Scenario: No question provided

- **WHEN** user types `/council ask` without a question
- **THEN** the system SHALL display a usage hint: `Usage: /council ask <question>`

#### Scenario: Council model not found

- **WHEN** the configured model is not in the model registry
- **THEN** the system SHALL display an informative error message

### Requirement: Compact result display

The system SHALL display council results in a compact, human-friendly format suitable for terminal output.

The compact format SHALL include:
- The question at the top
- One-line summaries of each member's opinion (icon, name, truncated opinion)
- Visual vote tally (names with vote counts)
- Winner designation
- Concise synthesis (if generated)
- Token usage summary at the bottom

#### Scenario: Results displayed compactly

- **WHEN** a council debate completes via `/council ask`
- **THEN** the output SHALL NOT use the verbose 80-char-separator format from the tool
- **THEN** the output SHALL display opinions as single-line summaries
- **THEN** the output SHALL show vote counts in a compact alignment

### Requirement: Progress notifications

The system SHALL emit live progress notifications via `ctx.ui.notify` during council execution.

- Each opinion generation SHALL show "📝 MemberName — N/9"
- Each vote SHALL show "🗳️  MemberName voting — N/9"
- The synthesis phase SHALL show "📋 Generating synthesis..."
- Completion SHALL show "✅ Council debate complete!"

#### Scenario: Progress displayed during debate

- **WHEN** user runs `/council ask <question>`
- **THEN** notifications appear progressively as each phase executes
