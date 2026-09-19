# Node.js chat API

This is a small Node.js/Express API that exposes a `POST /api/chat` endpoint,
accepts a plain-text message, sends it to an OpenRouter model, and returns the
model response as plain text.

## Run

Requires Node.js 20 or newer.

```bash
cd nodeJsDemo
npm install
```

Create a `.env` file and set your real OpenRouter API key:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_MODEL=openai/gpt-4o-mini
PORT=8080
```

Then start the API:

```bash
npm start
```

The server uses port `8080` by default. Test it with:

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: text/plain" \
  --data "Explain Node.js in simple terms."
```

Run the automated tests with `npm test`. The tests use a fake OpenAI client and
do not make paid API calls.
