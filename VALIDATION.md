# Validation — 26 September 2026

- Node syntax checks passed for server.mjs and public/app.js.
- `node --test test.mjs` passed: cross-origin rejection, token rejection, cloud model rejection, invalid role, input length limit, successful NDJSON stream, static response security header, unknown route.
- Real local Ollama runtime discovered 5 installed local models.
- Chrome end-to-end chat with llama3.2:1b: follow-up email request produced 71 output tokens, reported 9.6 output tokens/second, first text 7.82 seconds, total browser elapsed time 11.76 seconds.
- Follow-up asking for a shorter reply preserved conversation context: 28 output tokens, 7.1 tokens/second, first text 3.37 seconds, total 7.28 seconds.
- Stop generation verified in browser: partial response marked incomplete, prompt restored, input controls unlocked.
- Desktop visual inspection and narrow in-app view inspected. Layout adjusted for short desktop viewports.
- Measurements are individual smoke tests, not a statistically reliable benchmark or quality evaluation. Different prompts, background load, warm/cold models and hardware will change results.
- GitHub push not completed: current GitHub CLI credentials report invalid authentication. No credentials embedded in source.
- Machine: about 8 GB RAM, Intel Iris Xe integrated graphics. No external model API used. npm shim is broken on this machine; direct Node commands work and the launcher uses Node directly.
