import OpenAI from "openai";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export function createSummarizeService({
  client = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:8080",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME || "Node.js ticket summarizer",
    },
  }),
  model = process.env.OPENAI_MODEL || DEFAULT_MODEL,
} = {}) {
  return {
    async summarize(ticket) {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: `Summarize this support ticket in 2 lines:\n\n${ticket}`,
          },
        ],
      });

      const summary = response.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error("OpenRouter returned an empty summary");
      }

      return summary;
    },
  };
}
