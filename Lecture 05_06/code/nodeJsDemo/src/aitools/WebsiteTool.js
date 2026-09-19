import fs from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve("generated-sites");

await fs.mkdir(workspace, { recursive: true });

export const createDirectoryTool = {
  type: "function",
  function: {
    name: "create_directory",
    description: "Creates a new directory inside the website workspace.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative directory path, for example brewlab.",
        },
      },
      required: ["path"],
    },
  },
};

export const writeFileTool = {
  type: "function",
  function: {
    name: "write_file",
    description: "Creates or overwrites a text file inside the website workspace. Use this to create HTML, CSS and JavaScript files.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative file path, for example brewlab/index.html.",
        },
        content: {
          type: "string",
          description: "Complete content that should be written into the file.",
        },
      },
      required: ["path", "content"],
    },
  },
};

export const readFileTool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Reads the contents of an existing file from the website workspace.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative file path.",
        },
      },
      required: ["path"],
    },
  },
};

export const listFilesTool = {
  type: "function",
  function: {
    name: "list_files",
    description: "Lists all files and directories inside a website project.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative directory path, for example brewlab.",
        },
      },
      required: ["path"],
    },
  },
};

export const websiteTools = [
  createDirectoryTool,
  writeFileTool,
  readFileTool,
  listFilesTool,
];

function safePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error("Path is required");
  }

  const resolved = path.resolve(workspace, relativePath);

  if (!resolved.startsWith(`${workspace}${path.sep}`) && resolved !== workspace) {
    throw new Error("Access outside generated-sites is not allowed");
  }

  return resolved;
}

export async function createDirectory({ path: directoryPath }) {
  try {
    const directory = safePath(directoryPath);
    await fs.mkdir(directory, { recursive: true });
    return `Directory created successfully: ${directoryPath}`;
  } catch (error) {
    return `Failed to create directory: ${error.message}`;
  }
}

export async function writeFile({ path: filePath, content }) {
  try {
    const file = safePath(filePath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, "utf8");
    return `File written successfully: ${filePath}`;
  } catch (error) {
    return `Failed to write file: ${error.message}`;
  }
}

export async function readFile({ path: filePath }) {
  try {
    return await fs.readFile(safePath(filePath), "utf8");
  } catch (error) {
    return `Failed to read file: ${error.message}`;
  }
}

export async function listFiles({ path: directoryPath }) {
  try {
    const directory = safePath(directoryPath);
    const entries = await collectFiles(directory);

    if (!entries) {
      return `Directory does not exist: ${directoryPath}`;
    }

    return entries
      .filter((file) => file !== directory)
      .map((file) => path.relative(workspace, file))
      .join("\n");
  } catch (error) {
    return `Failed to list files: ${error.message}`;
  }
}

async function collectFiles(directory) {
  try {
    const stats = await fs.stat(directory);

    if (!stats.isDirectory()) {
      return null;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const result = [directory];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...await collectFiles(entryPath));
    } else {
      result.push(entryPath);
    }
  }

  return result;
}

export async function executeWebsiteTool(toolName, args) {
  if (toolName === "create_directory") {
    return createDirectory(args);
  }

  if (toolName === "write_file") {
    return writeFile(args);
  }

  if (toolName === "read_file") {
    return readFile(args);
  }

  if (toolName === "list_files") {
    return listFiles(args);
  }

  throw new Error(`Unsupported website tool: ${toolName}`);
}
