import OpenAI from "openai";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const SYSTEM_PROMPT = `
    You are a funny AI chatbot. You reply everything sarcastically.
`;

export function createChatService({
  client = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:8080",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME || "Node.js chat API",
    },
  }),
  model = process.env.OPENAI_MODEL || DEFAULT_MODEL,
  history = [],
} = {}) {
  return {
    async chat(message, onChunk) {
      const userMessage = {
        role: "user",
        content: message,
      };
      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
          ...history,
        userMessage,
      ];

      const stream = await client.chat.completions.create({
        model,
        messages,
        stream: true,
      });

      let reply = "";

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content || "";

        if(content) {
          reply += content;
          onChunk?.(content);
        }
      }

      if (!reply) {
        throw new Error("OpenRouter returned an empty response");
      }

      history.push(userMessage, {
        role: "assistant",
        content: reply,
      });

      return reply;
    },
  };
}
