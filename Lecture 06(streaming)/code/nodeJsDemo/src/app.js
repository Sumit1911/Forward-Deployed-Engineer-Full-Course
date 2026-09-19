import cors from "cors";
import express from "express";

const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

export function createApp(chatService) {
  if (!chatService?.chat) {
    throw new TypeError("A chat service is required");
  }

  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
    }),
  );
  app.use(express.static("public"));
  app.use(express.text({ type: "*/*", limit: "100kb" }));

  app.post("/api/chat", async (request, response) => {
    const message = typeof request.body === "string" ? request.body : "";

    if (!message.trim()) {
      return response
        .status(400)
        .type("text/plain")
        .send("Message is required.");
    }

    try {
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.setHeader("Transfer-Encoding", "chunked");
      response.setHeader("Cache-Control", "no-cache");
      response.setHeader("Connection", "keep-alive");
      response.flushHeaders();

      await chatService.chat(message, (chunk) => {
        response.write(chunk);
      });

      response.end();
    } catch (error) {
      console.error("Failed to chat with model:", error);
      return response
        .status(500)
        .type("text/plain")
        .send("Unable to get a model response.");
    }
  });

  return app;
}
