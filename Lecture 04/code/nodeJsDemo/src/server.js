import "dotenv/config";

import { createApp } from "./app.js";
import { createChatService } from "./summarizeService.js";

const port = Number(process.env.PORT || 8080);
const app = createApp(createChatService());

app.listen(port, () => {
  console.log(`Node.js chat API listening on port ${port}`);
});
