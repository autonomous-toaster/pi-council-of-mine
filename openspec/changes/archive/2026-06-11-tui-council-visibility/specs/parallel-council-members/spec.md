## ADDED Requirements

### Requirement: Council member opinion generation is parallel

The `generateAllOpinions` function SHALL generate independent member opinions in parallel using `Promise.allSettled()`. Each member's opinion generation is fully independent (no shared state, no ordering dependency), so they MAY run concurrently.

#### Scenario: All members succeed
- **WHEN** all 9 council members successfully generate opinions
- **THEN** all 9 opinions SHALL be returned with their respective member IDs and names
- **AND** the function SHALL complete in approximately the time of the slowest single member call (not the sum of all 9)

#### Scenario: One member fails
- **WHEN** one council member's API call fails (network error, rate limit, timeout)
- **THEN** the failing member SHALL be assigned a fallback opinion text: "[member name] was unable to provide an opinion."
- **AND** the other 8 opinions SHALL still be returned successfully
- **AND** a count of failures SHALL be returned alongside the opinions

#### Scenario: All members fail
- **WHEN** all 9 council members fail to generate opinions
- **THEN** an error SHALL be thrown with a descriptive message
- **AND** the council debate SHALL abort with no results

### Requirement: Concurrency is unbounded (no limit)

All 9 members SHALL be launched simultaneously with no artificial concurrency cap. The pi AI SDK's request queue handles concurrency at the transport level.

#### Scenario: 9 simultaneous calls
- **WHEN** `generateAllOpinions` is called
- **THEN** all 9 `completeSimple` calls SHALL be initiated at approximately the same time

### Requirement: Voting phase remains sequential

The voting phase SHALL remain sequential because each member's vote depends on ALL opinions being available. Parallel voter execution is deferred to a future change.

#### Scenario: Voting after opinions complete
- **WHEN** all opinions have been generated (or failed with fallbacks)
- **THEN** voting SHALL proceed sequentially, member by member
- **AND** voting SHALL NOT begin until all opinions are available
