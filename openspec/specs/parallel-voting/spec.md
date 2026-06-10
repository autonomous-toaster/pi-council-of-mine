## Purpose

Defines how council member voting executes — moving from sequential to parallel execution with configurable concurrency to prevent rate limiting.

## Requirements

### Requirement: Voting phase runs in parallel with configurable concurrency

The `conductVoting` function SHALL execute all 9 member votes in parallel using a batched worker pattern. Each vote is fully independent of all other votes (no shared state, no ordering dependency), so they MAY run concurrently, limited by the configured concurrency.

#### Scenario: All votes succeed
- **WHEN** all 9 council members successfully cast votes
- **THEN** all 9 votes SHALL be returned
- **AND** the function SHALL complete in approximately the time of the slowest batch

#### Scenario: One member fails to vote
- **WHEN** one council member's vote API call fails
- **THEN** that member's vote SHALL be omitted from results
- **AND** the other 8 votes SHALL still be returned

#### Scenario: All members fail to vote
- **WHEN** all 9 members fail to cast votes
- **THEN** an empty results array SHALL be returned (the tally will handle zero votes gracefully)

### Requirement: Concurrency is configurable

Both the opinion generation and voting phases SHALL respect the `memberConcurrency` config key. Default is 3.

#### Scenario: Default concurrency (3)
- **WHEN** `memberConcurrency` is not set in config
- **THEN** the default value of 3 SHALL be used for voting
- **AND** calls SHALL be dispatched in batches of up to 3 at a time

#### Scenario: Maximum concurrency (9)
- **WHEN** `memberConcurrency` is set to 9
- **THEN** all 9 voting calls SHALL be dispatched simultaneously

#### Scenario: Sequential (1)
- **WHEN** `memberConcurrency` is set to 1
- **THEN** votes SHALL execute one at a time (equivalent to the old sequential behavior)
