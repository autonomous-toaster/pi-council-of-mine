## ADDED Requirements

### Requirement: Question shown inline in the tool call row

When the executor calls `ask_council`, the tool call row SHALL display a `renderCall` showing the truncated question text inline, so the user can see what's being debated at a glance.

#### Scenario: Short question
- **WHEN** the executor calls `ask_council({ question: "Is Neo The One?" })`
- **THEN** the tool row SHALL display `ask_council "Is Neo The One?"` (truncated to fit available width, max ~120 chars)

#### Scenario: Long question
- **WHEN** the executor calls `ask_council` with a question longer than 120 characters
- **THEN** the display SHALL truncate with "..." suffix

### Requirement: Compact result summary in the tool row

After the council debate completes, the tool result row SHALL display a `renderResult` showing a compact summary: the winning perspective and total token usage.

#### Scenario: Single winner
- **WHEN** a council debate completes with Systems Thinker as winner (4 votes)
- **THEN** the collapsed result SHALL display something like `🏆 Systems Thinker (4v) ↑12k↓2k`
- **AND** when expanded (e.g., clicking or keybinding), the full formatted output SHALL be shown

#### Scenario: Tie
- **WHEN** a council debate completes with a tie (Pragmatist and Visionary both at 3 votes)
- **THEN** the collapsed result SHALL display `🏆 Tie: Pragmatist(3v) Visionary(3v)`

### Requirement: Footer status updates after debate

After each council debate, the footer status area SHALL update to show the last winners and vote counts, so the user can see council activity at a glance.

#### Scenario: After debate completes
- **WHEN** a council debate completes
- **THEN** the `setStatus("council", ...)` SHALL be updated from "Council Active" to something like "Council: SysThinker(4v)" or "Council: Pragmatist(3v) Visionary(3v)"
