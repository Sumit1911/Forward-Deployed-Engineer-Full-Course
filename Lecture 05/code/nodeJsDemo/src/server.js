import "dotenv/config";

import { createApp } from "./app.js";
import { createWebsiteBuilderService } from "./WebsiteBuilderService.js";
import { createChatService } from "./chatService.js";

const port = Number(process.env.PORT || 8080);
const app = createApp(createChatService(), createWebsiteBuilderService());

app.listen(port, () => {
  console.log(`Node.js chat API listening on port ${port}`);
});
