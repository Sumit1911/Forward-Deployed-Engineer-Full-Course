import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";

test("POST /api/chat returns the generated plain-text reply", async () => {
  const service = {
    chat: async (message) => {
      assert.equal(message, "Tell me a short joke.");
      return "Why did the server stay calm?\nIt had good uptime.";
    },
  };

  const response = await request(createApp(service))
    .post("/api/chat")
    .type("text/plain")
    .send("Tell me a short joke.");

  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /^text\/plain/);
  assert.equal(
    response.text,
    "Why did the server stay calm?\nIt had good uptime.",
  );
});

test("POST /api/chat rejects an empty message", async () => {
  const service = {
    chat: async () => {
      throw new Error("should not be called");
    },
  };

  const response = await request(createApp(service))
    .post("/api/chat")
    .type("text/plain")
    .send("   ");

  assert.equal(response.status, 400);
  assert.equal(response.text, "Message is required.");
});
