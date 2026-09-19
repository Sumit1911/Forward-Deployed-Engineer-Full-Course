import cors from "cors";
import express from "express";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

export function createApp(chatService, websiteBuilderService) {
  if (!chatService?.chat) {
    throw new TypeError("A chat service is required");
  }

  if (!websiteBuilderService?.generate) {
    throw new TypeError("A website builder service is required");
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
      const reply = await chatService.chat(message);
      return response.type("text/plain").send(reply);
    } catch (error) {
      console.error("Failed to chat with model:", error);
      return response
        .status(500)
        .type("text/plain")
        .send("Unable to get a model response.");
    }
  });

  app.post("/website", async (request, response) => {
    const message = typeof request.body === "string" ? request.body : "";

    if (!message.trim()) {
      return response
        .status(400)
        .type("text/plain")
        .send("Message is required.");
    }

    try {
      const reply = await websiteBuilderService.generate(message);
      return response.type("text/plain").send(reply);
    } catch (error) {
      console.error("Failed to generate website:", error);
      return response
        .status(500)
        .type("text/plain")
        .send("Unable to generate website.");
    }
  });

  return app;
}
