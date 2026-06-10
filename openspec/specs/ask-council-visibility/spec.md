## Purpose

Defines how the council tool communicates its status and results to the user via the pi TUI — notifications, footer indicators, and post-debate stats.

## Requirements

### Requirement: Question shown in TUI notification during execution

When the `ask_council` tool is invoked, the TUI SHALL display a notification showing the first 80 characters of the question being debated, so the user can see what topic the council is discussing.

#### Scenario: Tool invoked with short question
- **WHEN** the executor calls `ask_council({ question: "Is Neo The One?" })`
- **THEN** a TUI notification SHALL display "🏛️ Council of Mine: debating \"Is Neo The One?\"..."

#### Scenario: Tool invoked with long question
- **WHEN** the executor calls `ask_council` with a question longer than 80 characters
- **THEN** the notification SHALL truncate to 80 characters, ending with "..."
- **AND** the full question SHALL still appear in the council results

### Requirement: Persistent "Council Active" status indicator

When the council is enabled via `/council on`, a persistent green status indicator SHALL appear in the TUI footer area using `ctx.ui.setStatus()`.

#### Scenario: Council enabled
- **WHEN** the user runs `/council on`
- **THEN** the TUI SHALL show a "Council Active" label in the footer

#### Scenario: Council disabled
- **WHEN** the user runs `/council off`
- **THEN** the "Council Active" label SHALL be removed from the footer

#### Scenario: Session ends
- **WHEN** the pi session ends
- **THEN** the "Council Active" label SHALL be cleared

### Requirement: Post-debate stats notification

After a council debate completes, a notification SHALL display summary statistics: total token usage (input + output) and winner(s) with vote counts.

#### Scenario: Single winner
- **WHEN** a council debate completes with a single winner (e.g., Systems Thinker with 4 votes)
- **THEN** the notification SHALL include the winner name and vote count

#### Scenario: Tie (multiple winners)
- **WHEN** a council debate completes with a tie (e.g., Pragmatist and Visionary both with 3 votes)
- **THEN** the notification SHALL list all tied winners and their vote counts

### Requirement: Stats include token usage

When the council debate completes, the notification SHALL include the total input and output tokens consumed by all council members, the voting phase, and the synthesis.

#### Scenario: Tokens displayed
- **WHEN** a council debate completes
- **THEN** the notification SHALL show total input and output token counts for the entire debate
