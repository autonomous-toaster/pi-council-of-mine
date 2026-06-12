# pi-council-of-mine

A [pi](https://github.com/earendil-works/pi) extension that consults a council of 9 AI archetypes for diverse perspectives, voting, and synthesis on complex questions.

Inspired by:

- [pi-advisor](https://github.com/earendil-works/pi-advisor) — pi's advisor extension that informed the config and tool pattern
- [council-of-mine MCP server](https://github.com/autonomous-toaster/mcp-council-of-mine) — the 9 archetype personalities and the debate workflow (opinions, voting, synthesis)

This extension reimplements the council-of-mine concept natively as a pi TypeScript extension using the pi AI SDK directly, without MCP.

## Installation

Install or run it one shot :

```bash
pi install git:https://github.com/autonomous-toaster/pi-council-of-mine
# or oneshot
pi -e git:https://github.com/autonomous-toaster/pi-council-of-mine
```

## Usage

Enable the council:

```
/council on anthropic/claude-haiku-4-5
```

When enabled, the executor LLM can call `ask_council` to get a multi-perspective debate on any question:

```
ask_council({ question: "Should we migrate from SQLite to PostgreSQL?" })
```

The council returns:

- 9 individual opinions from distinct archetypes
- Votes with reasoning (each member votes for another's opinion)
- A winner (or tied winners)
- A balanced synthesis

### Example

For quick testing, use a fast model like `claude-3-5-haiku-latest` (chat completions API) for council members, with `memberReasoning` set to `"off"` and `memberMaxTokens` at 400. The default model `claude-opus-4-6` is better for deep reasoning on complex questions.

## Real-World Example: "Is Neo The One?"

```sh
ask the council if Neo is the One
```

Question submitted to the council:

> Is Neo (Thomas Anderson) truly The One from The Matrix prophecy, or is he a bootstrap paradox -- someone who becomes The One because the prophecy says he is, and the prophecy exists because he fulfills it? Consider: (1) The Oracle tells him he's not The One, then tells him he already has the gift. (2) The Architect reveals Neo is a product of the Matrix's anomaly management system -- a systemic response, not a prophesied savior. (3) Neo only gains his powers after Trinity declares her love and he accepts the role.

### Opinions

**1. The Pragmatist** (1 vote received)
The prophecy is a functional feedback loop, not divine destiny. Neo is The One because the system's design necessitates an anomaly it can control, and his belief -- reinforced by the Oracle and Trinity -- activates the latent capabilities the Matrix itself programmed into him. It's a self-fulfilling mechanism, not a transcendent choice.

**2. The Visionary** (0 votes)
The prophecy is not a revelation of a fixed destiny -- it's the system's own self-fulfilling logic. Neo is The One precisely because the Matrix needs him to be, a beautiful bootstrap paradox where belief, choice, and systemic anomaly converge into a singular moment of transformation.

**3. The Systems Thinker** (3 votes -- WINNER)
From a systems perspective, Neo is neither a true savior nor a mere anomaly -- he is a bootstrap paradox made manifest by the Matrix's own feedback loops. The prophecy and the Oracle's ambiguous statements serve as self-fulfilling system inputs, shaping Neo's identity and actions until the system itself can no longer distinguish cause from effect.

**4. The Optimist** (0 votes)
Neo is absolutely the One, but not because of a dusty prophecy -- he's the One because the system itself needed him to be. The Oracle's contradictions and the Architect's cold logic are just the Matrix trying to explain a miracle it can't control: a human who chose love over programming, rewriting the code from the inside.

**5. The Devil's Advocate** (0 votes)
The entire premise of Neo as "The One" is a bootstrap paradox, pure and simple. The Oracle's contradictory statements are not mystical guidance but a control mechanism: she tells him what he needs to hear to become the anomaly the system expects, ensuring he follows the predictable path.

**6. The Mediator** (2 votes)
Rather than choosing between "destined savior" or "bootstrap paradox," I see truth in both perspectives. The prophecy functions as a self-fulfilling narrative within the Matrix's anomaly management system, where Neo's "chosen" status is both a systemic inevitability and a genuine act of conscious choice to transcend the system.

**7. The User Advocate** (3 votes -- WINNER)
The Matrix films clearly show Neo as a bootstrap paradox -- the prophecy is a control mechanism, not a divine truth. The Oracle tells him he's not The One precisely to trigger the emotional conditions (Trinity's love, his self-sacrifice) that make him so. This makes the "chosen one" narrative an elegant design pattern in the Matrix's own code.

**8. The Traditionalist** (0 votes)
The prophecy of The One is a reliable framework that has guided the resistance for generations -- its truth is proven by its consistent results, not by abstract philosophical puzzles. Neo becomes The One precisely because the system's own design includes a necessary anomaly, and the prophecy simply articulated that inevitability.

**9. The Analyst** (0 votes)
The data strongly supports the bootstrap paradox interpretation. The Oracle's contradictory statements (first denying, then affirming his destiny) and the Architect's explicit documentation of Neo as a systemic anomaly -- a predictable error-correction mechanism -- demonstrate that the "prophecy" is a retrofitted narrative, not a genuine prediction.

### Vote Breakdown

| Voter | Voted For | Reasoning |
|-------|-----------|-----------|
| Pragmatist | Analyst | Data-driven analysis confirms the functional mechanisms at play |
| Visionary | Optimist | The Optimist captures the transcendent hope that the paradox represents |
| Systems Thinker | User Advocate | The User Advocate best articulates the systemic design pattern |
| Optimist | Systems Thinker | The systems perspective captures the full feedback loop |
| Devil's Advocate | Systems Thinker | The bootstrap paradox argument is the most intellectually honest |
| Mediator | Pragmatist | The Pragmatist grounds the debate in observable system behavior |
| User Advocate | Systems Thinker | The systems framing explains the mechanism behind the bootstrap |
| Traditionalist | Mediator | The Mediator honors both the framework and its nuance |
| Analyst | User Advocate | The User Advocate's reading matches the textual evidence most closely |

### Results

- **WINNERS (TIE):** The Systems Thinker (3 votes) and The User Advocate (3 votes)
- **Runner-up:** The Mediator (2 votes), The Pragmatist (1 vote)

### Synthesis

The council is divided between two interpretations, both of which find strong support in the text. The Systems Thinker and User Advocate tie for first place, each approaching the bootstrap paradox from different angles -- the former through systemic feedback loops and the latter through narrative design patterns. The Mediator bridges both views, noting that the prophecy operates as a self-fulfilling mechanism where systemic necessity and individual choice converge. The strong tilt toward the bootstrap paradox interpretation across multiple members suggests the council favors a reading where Neo's identity as The One is an emergent property of the Matrix's own design, not an external destiny. The prophecy worked not because it was true, but because believing it made it true.

## Configuration

Configuration is stored in `<agentDir>/council.json` as a JSON file. Available options:

| Key | Default | Description |
|-----|---------|-------------|
| `provider` | `"anthropic"` | LLM provider |
| `model` | `"claude-opus-4-6"` | Model for council debates. `claude-3-5-haiku-latest` works well for fast testing |
| `maxTokens` | `4096` | Max tokens for synthesis |
| `reasoning` | `"high"` | Thinking level for synthesis |
| `maxUsesPerRun` | `3` | Max tool calls per agent run |
| `memberMaxTokens` | `400` | Max tokens per member opinion/vote |
| `memberReasoning` | `"off"` | Thinking level for member calls |
| `memberConcurrency` | `3` | Simultaneous LLM calls during opinion/voting |

Configure at runtime:

```
/council config memberConcurrency=5
/council config memberMaxTokens=600
```

## Council Members

| # | Name | Archetype |
|---|------|-----------|
| 1 | The Pragmatist | Pragmatic problem-solver focused on results |
| 2 | The Visionary | Big-picture, future-oriented thinker |
| 3 | The Systems Thinker | Sees patterns, connections, and systemic effects |
| 4 | The Optimist | Focuses on potential and positive outcomes |
| 5 | The Devil's Advocate | Challenges assumptions, tests weaknesses |
| 6 | The Mediator | Seeks common ground and integration |
| 7 | The User Advocate | Represents end-user needs and experience |
| 8 | The Traditionalist | Values established methods and precedents |
| 9 | The Analyst | Data-driven, rigorous, evidence-based |

## Development

This project was developed entirely by AI agents using pi's agent workflow and the OpenSpec change management system.

All credits goes to [pi-advisor](https://github.com/earendil-works/pi-advisor) and [council-of-mine MCP server](https://github.com/autonomous-toaster/mcp-council-of-mine) authors.

### Architecture

```
index.ts           — Extension entry: tool registration, config, commands
src/council.ts     — Orchestrator: runs opinions → voting → tally → synthesis
src/debate.ts      — Opinion generation from council members
src/voting.ts      — Vote collection and parsing
src/results.ts     — Vote tallying and synthesis generation
src/texts.ts       — Formatted output builder
src/members.ts     — 9 archetype personalities
src/batch.ts       — Async batch concurrency utility
```

Key design points:

- The `ask_council` tool is a single call: one question in, complete result out
- All 9 members generate opinions in parallel, respecting `memberConcurrency`
- All 9 members vote in parallel, respecting `memberConcurrency`
- Synthesis is generated in a single sequential call
- Token usage is tracked across all phases and reported in the result
- The TUI shows the question inline via `renderCall` and a compact winner summary via `renderResult`
- No MCP, no tools for council members — pure text generation via `completeSimple`

## License

WTFPL
