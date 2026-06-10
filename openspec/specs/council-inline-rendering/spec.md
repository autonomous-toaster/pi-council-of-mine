## Purpose

Defines how the ask_council tool renders inline in the pi TUI — showing the question during execution and a compact result summary after completion.

## Requirements

### Requirement: Question shown inline in the tool call row

When the executor calls `ask_council`, the tool call row SHALL display a `renderCall` showing the truncated question text inline, so the user can see what's being debated at a glance.

#### Scenario: Short question
- **WHEN** the executor calls `ask_council({ question: "Is Neo The One?" })`
- **THEN** the tool row SHALL display `ask_council "Is Neo The One?"` (truncated to fit available width, max ~120 chars)

#### Scenario: Long question
- **WHEN** the executor calls `ask_council` with a question longer than 120 characters
- **THEN** the display SHALL truncate with "..." suffix

### Requirement: Compact result summary in the tool row

After the council debate completes, the tool result row SHALL display a `renderResult` showing a compact summary: the winning perspective.

#### Scenario: Single winner
- **WHEN** a council debate completes with Systems Thinker as winner (4 votes)
- **THEN** the collapsed result SHALL display something like `✓ 🏆 Systems Thinker (4 votes)`
- **AND** when expanded, the full formatted output SHALL be shown

#### Scenario: Tie
- **WHEN** a council debate completes with a tie (Pragmatist and Visionary both at 3 votes)
- **THEN** the collapsed result SHALL display the tied winners
