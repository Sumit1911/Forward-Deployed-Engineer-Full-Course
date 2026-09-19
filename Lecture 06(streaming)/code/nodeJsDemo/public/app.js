const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const messages = document.querySelector("#messages");
const API_URL = "http://localhost:8080/api/chat";

function appendMessage(role, text) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.append(bubble);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;

  return bubble;
}

function setLoading(isLoading) {
  const button = form.querySelector("button");
  button.disabled = isLoading;
  input.disabled = isLoading;
  button.textContent = isLoading ? "Sending" : "Send";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) {
    return;
  }

  appendMessage("user", message);
  input.value = "";
  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: message,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to get a response from the server.");
    }

    const assistantBubble = appendMessage("assistant", "");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while(true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      assistantBubble.textContent += chunk;
      messages.scrollTop = messages.scrollHeight;
    }
  } catch (error) {
    appendMessage("assistant", error.message);
  } finally {
    setLoading(false);
    input.focus();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
