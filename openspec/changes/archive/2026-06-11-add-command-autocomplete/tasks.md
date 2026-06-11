## 1. Implementation

- [x] 1.1 Add `getArgumentCompletions` to `pi.registerCommand("council", ...)` that parses the prefix into subcommand and position
- [x] 1.2 Return subcommand completions (`on`, `off`, `ask`, `config`) for the first argument position
- [x] 1.3 Return config key completions (`provider=`, `model=`, `maxTokens=`, `reasoning=`, `maxUsesPerRun=`, `memberMaxTokens=`, `memberReasoning=`, `memberConcurrency=`) after `/council config`
- [x] 1.4 Return `null` (no completions) for subcommands without structured arguments (`off`, `ask`) and for `/council on` arguments
