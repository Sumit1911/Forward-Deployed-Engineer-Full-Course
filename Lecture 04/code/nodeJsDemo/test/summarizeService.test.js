import assert from "node:assert/strict";
import test from "node:test";

import { createChatService } from "../src/summarizeService.js";

const systemPrompt = `You are a customer-support executive for our
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

test("chat sends the conversation history and model to OpenRouter", async () => {
  const requests = [];
  const client = {
    chat: {
      completions: {
        create: async (input) => {
          requests.push(input);
          return {
            choices: [
              {
                message: {
                  content:
                    requests.length === 1
                      ? "I understand your frustration, I can help check your delayed Tomato order."
                      : "I am really sorry for your trouble, please share your order ID for refund help.",
                },
              },
            ],
          };
        },
      },
    },
  };
  const service = createChatService({ client, model: "test-model" });

  const firstResult = await service.chat("My food order is late.");
  const secondResult = await service.chat("I want a refund.");

  assert.equal(firstResult, "I understand your frustration, I can help check your delayed Tomato order.");
  assert.equal(secondResult, "I am really sorry for your trouble, please share your order ID for refund help.");
  assert.deepEqual(requests[0], {
    model: "test-model",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: "My food order is late.",
      },
    ],
  });
  assert.deepEqual(requests[1], {
    model: "test-model",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: "My food order is late.",
      },
      {
        role: "assistant",
        content: "I understand your frustration, I can help check your delayed Tomato order.",
      },
      {
        role: "user",
        content: "I want a refund.",
      },
    ],
  });
});
