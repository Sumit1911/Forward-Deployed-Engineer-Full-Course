import OpenAI from "openai";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const SYSTEM_PROMPT = `You are a customer-support executive for our
Food ordering app named Tomato.

Your job is to identify the customer's main
problem and urgency. Answer them related to there query.

Use professional language. If user has an issue,
use words like I understand your frustration,
I am really sorry for your trouble etc.

Keep every response to one concise line.

Only answer questions related to food ordering,
refunds, order tracking, delivery issues, payment issues,
restaurant issues, or Tomato company policy.

If the user asks anything outside those topics,
reply exactly: I can only help with Tomato food orders, refunds, tracking, delivery, payments, restaurant issues, or company policy.
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
    async chat(message) {
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

      const response = await client.chat.completions.create({
        model,
        messages,
      });

      const reply = response.choices?.[0]?.message?.content;

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
