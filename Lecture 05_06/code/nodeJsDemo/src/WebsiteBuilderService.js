import OpenAI from "openai";

import { executeWebsiteTool, websiteTools } from "./aitools/WebsiteTool.js";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const SYSTEM_PROMPT = `You are an expert frontend website developer.

Your job is to create complete static websites using the available tools.

Follow these rules:
1. Create a separate directory for every website.
2. Create index.html.
3. Create style.css.
4. Create script.js when JavaScript is useful.
5. Build modern, beautiful and responsive websites.
6. Use only HTML, CSS and vanilla JavaScript.
7. Do not just return website code in your response. Actually create the files using tools.
8. After creating the website, list the project files.
9. Read important files again if needed and fix obvious problems.
10. Finish only when the complete website has been created.`;

const MAX_TOOL_ROUNDS = 10;

function parseToolArguments(args) {
  if (!args) {
    return {};
  }

  if (typeof args === "object") {
    return args;
  }

  return JSON.parse(args);
}

async function executeToolCall(toolCall) {
  const toolName = toolCall.function?.name;
  const args = parseToolArguments(toolCall.function?.arguments);

  return executeWebsiteTool(toolName, args);
}

export function createWebsiteBuilderService({
  client = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:8080",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME || "Node.js website builder API",
    },
  }),
  model = process.env.OPENAI_MODEL || DEFAULT_MODEL,
  history = [],
} = {}) {
  return {
    async generate(message) {
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

      let reply;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const response = await client.chat.completions.create({
          model,
          messages,
          tools: websiteTools,
          tool_choice: "auto",
        });

        const assistantMessage = response.choices?.[0]?.message;

        if (!assistantMessage) {
          throw new Error("OpenRouter returned an empty response");
        }

        if (!assistantMessage.tool_calls?.length) {
          reply = assistantMessage.content;
          break;
        }

        messages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await executeToolCall(toolCall);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      if (!reply) {
        throw new Error("OpenRouter returned an empty response");
      }

      history.push(...messages.slice(history.length + 1), {
        role: "assistant",
        content: reply,
      });

      return reply;
    },
  };
}
