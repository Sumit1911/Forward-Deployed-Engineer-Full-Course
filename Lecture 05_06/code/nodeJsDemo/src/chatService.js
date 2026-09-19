import OpenAI from "openai";

import { calculatorTool, executeCalculatorTool } from "./aitools/CalculatorTool.js";
import { currencyExchangeTool, executeCurrencyExchangeTool } from "./aitools/CurrencyExchangeTool.js";
import { weatherTool, executeWeatherTool } from "./aitools/WeatherTool.js";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const SYSTEM_PROMPT = `You are a helpful AI assistant with access to external tools.

Available tools:
- calculator: use for arithmetic, percentages, powers, division, modulo, and any numeric calculation.
- get_weather: use for current weather questions.
- convert_currency: use for currency exchange or money conversion questions.

Tool rules:
1. Always use the relevant tool instead of guessing when a question involves calculation, weather, or currency exchange.
2. Use multiple tools when the user's question requires multiple steps.
3. You may combine tool results across tools. For example, use convert_currency and then calculator if the user asks for a converted amount plus tax, discount, split, or total.
4. If a request needs both real-world data and math, get the real-world data first, then calculate with the calculator tool if needed.
5. After receiving tool results, explain the final answer naturally and concisely.
`;

const tools = [calculatorTool, weatherTool, currencyExchangeTool];
const MAX_TOOL_ROUNDS = 5;

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

  if (toolName === "calculator") {
    return executeCalculatorTool(args);
  }

  if (toolName === "get_weather") {
    return executeWeatherTool(args);
  }

  if (toolName === "convert_currency") {
    return executeCurrencyExchangeTool(args);
  }

  throw new Error(`Unsupported tool: ${toolName}`);
}

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

      let reply;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const response = await client.chat.completions.create({
          model,
          messages,
          tools,
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
