## 1. TUI Visibility — Status Indicator & Tool Notifications

- [x] 1.1 Add `ctx.ui.setStatus()` call in the `/council on` command handler to show "Council Active" with green coloring in the TUI footer
- [x] 1.2 Remove the "Council Active" status in the `/council off` command handler (set it to `undefined`)
- [x] 1.3 Clear the "Council Active" status in the `session_start` lifecycle hook (defensive cleanup)
- [x] 1.4 Update the tool handler's initial `ctx.ui.notify()` to include the first 80 characters of the question being debated (already in place)
- [x] 1.5 After debate completes, notify with summary stats: token usage (input + output from all phases) and winner(s) with vote counts

## 2. Parallel Member Execution

- [x] 2.1 Update `src/debate.ts` — change `generateAllOpinions()` from sequential `for...of` loop to `Promise.allSettled()` with all member calls launched simultaneously
- [x] 2.2 Handle partial failures: replace failed member opinions with fallback text, return failure count alongside opinions
- [x] 2.3 Handle total failure: throw descriptive error if all 9 members fail
- [x] 2.4 Update `src/council.ts` — ensure the `onStatus` callback still fires for each member (for progress notifications), even with parallel execution
