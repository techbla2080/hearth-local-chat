# Hearth — Local intelligence

![Hearth campaign artwork: Your AI. On your hardware.](marketing/hearth-launch.png)

**Built by Pranav Agarwal · [Discuss a local AI project on X](https://x.com/PranavAgarwal82)**

Working today: local model chat, streamed responses, configurable system instructions and measured inference performance. Planned next: document retrieval and evaluated fine-tuning experiments. The image above is campaign artwork, not a screenshot or a hardware requirement.

Local LLM portfolio project 01 by Pranav Agarwal. A browser chat workspace backed by an existing local Ollama installation. This is inference, not fine-tuning or RAG.

## Start
Requires Node.js 22+ and Ollama running locally at 127.0.0.1:11434 with a downloaded model. Run `ollama pull llama3.2:1b` if needed (requires internet for initial model download). Double-click **Start Hearth.cmd**, or run `npm start` and visit http://127.0.0.1:8766. No npm dependencies or API keys. Open Ollama before launching Hearth. If the browser opens before the server, refresh once.

## Demonstrate
1. Select Llama 3.2 1B (default when installed).
2. Choose a prompt card, then Send message.
3. Watch streaming text; inspect measured tokens/second, generated tokens, first-text delay and total wall-clock time.
4. Ask a follow-up to demonstrate conversation context.
5. Change system instructions for a different tone. Stop generation when needed. Export completed conversation turns as JSON.

## Architecture and scope
Browser -> loopback Node HTTP server -> loopback Ollama /api/chat. Plain HTML/CSS/JavaScript UI; no CDN, remote fonts, analytics or cloud model provider. Backend binds exclusively to 127.0.0.1, rejects foreign Origin/Host and requires a per-process token on chat requests. Installed models are checked via /api/show and cloud-backed models are excluded. No arbitrary backend URL from the client. One generation at a time, 180-second timeout, disconnect cancellation, 4096 context setting, 6000-character conversation input limit, 1500-character system instruction limit and 512-token output cap. Character limits are not exact token counts; dense/non-English input can still exceed model context. New chat resets context. Context is not silently summarized.

Chats are held in browser memory, not persisted by the app; refresh clears them. Export deliberately downloads a file. Interrupted turns are excluded from subsequent context and the prompt is restored. The app does not execute model output and renders text safely, not HTML. This is a single-user local demo, not authenticated enterprise software or a public hosted service. Do not expose the server or Ollama to the internet. Local operation is not an audited privacy guarantee for the entire computer or third-party runtime.

Model sizes shown are disk sizes, not RAM usage. Initial target machine: about 8 GB RAM and Intel Iris Xe integrated graphics; default installed llama3.2:1b. Larger models may be slow or run out of memory. Outputs can be wrong; no web search, document uploads, retrieval, tool execution, or fine-tuning. No provider per-token API billing for local inference; hardware and electricity still cost money. Respect each model's license when distributing or deploying.

## Verification
`node --test test.mjs` checks the API boundary, input validation and stream plumbing using a mock upstream. Live model and browser checks are recorded separately in VALIDATION.md. Mock tests do not measure model quality. You can also start with `node server.mjs` directly if your npm installation is unavailable.

API reference: https://docs.ollama.com/api/chat and https://docs.ollama.com/api/tags
