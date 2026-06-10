## Purpose

Defines how council member opinion generation executes — initially sequential, later parallelized with configurable concurrency. This spec tracks the evolution of the execution model.

## Requirements

### Requirement: Council member opinion generation is parallel with configurable concurrency

The `generateAllOpinions` function SHALL generate independent member opinions in parallel using a batched worker pattern. Each member's opinion generation is fully independent (no shared state, no ordering dependency), so they MAY run concurrently, limited by the configured concurrency.

#### Scenario: All members succeed
- **WHEN** all 9 council members successfully generate opinions
- **THEN** all 9 opinions SHALL be returned with their respective member IDs and names
- **AND** the function SHALL complete in approximately the time of the slowest batch (not the sum of all 9)

#### Scenario: One member fails
- **WHEN** one council member's API call fails (network error, rate limit, timeout)
- **THEN** the failing member SHALL be assigned a fallback opinion text: "[member name] was unable to provide an opinion."
- **AND** the other 8 opinions SHALL still be returned successfully

#### Scenario: All members fail
- **WHEN** all 9 council members fail to generate opinions
- **THEN** an error SHALL be thrown with a descriptive message
- **AND** the council debate SHALL abort with no results

### Requirement: Concurrency is configurable

Opinion generation respects a `memberConcurrency` config key that controls how many simultaneous LLM calls are allowed. Default is 3.

#### Scenario: Default concurrency (3)
- **WHEN** `memberConcurrency` is not set
- **THEN** calls SHALL be dispatched in batches of up to 3 at a time

#### Scenario: Maximum concurrency (9)
- **WHEN** `memberConcurrency` is set to 9
- **THEN** all 9 calls SHALL be dispatched simultaneously

#### Scenario: Sequential (1)
- **WHEN** `memberConcurrency` is set to 1
- **THEN** calls SHALL execute one at a time (sequential)
