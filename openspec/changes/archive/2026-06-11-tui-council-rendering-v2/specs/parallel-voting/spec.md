## ADDED Requirements

### Requirement: Voting phase runs in parallel

The `conductVoting` function SHALL execute all 9 member votes in parallel using `Promise.allSettled()`. Each vote is fully independent of all other votes (no shared state, no ordering dependency), so they MAY run concurrently.

#### Scenario: All votes succeed
- **WHEN** all 9 council members successfully cast votes
- **THEN** all 9 votes SHALL be returned
- **AND** the function SHALL complete in approximately the time of the slowest single vote call

#### Scenario: One member fails to vote
- **WHEN** one council member's vote API call fails
- **THEN** that member's vote SHALL be omitted from results
- **AND** the other 8 votes SHALL still be returned

#### Scenario: All members fail to vote
- **WHEN** all 9 members fail to cast votes
- **THEN** an empty results array SHALL be returned (the tally will handle zero votes gracefully)

### Requirement: Concurrency is configurable

Both opinion generation and voting phases SHALL respect a configurable concurrency limit that prevents too many simultaneous LLM calls.

#### Scenario: concurrency default (3)
- **WHEN** `memberConcurrency` is not set in config
- **THEN** the default value of 3 SHALL be used for both opinion and voting phases
- **AND** calls SHALL be dispatched in batches of 3 at a time

#### Scenario: concurrency set to 9
- **WHEN** `memberConcurrency` is set to 9 via `/council config memberConcurrency=9`
- **THEN** all 9 calls SHALL be dispatched simultaneously in both phases

#### Scenario: concurrency set to 1 (fully sequential)
- **WHEN** `memberConcurrency` is set to 1
- **THEN** calls SHALL execute one at a time (equivalent to the old sequential behavior)
