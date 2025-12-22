import type { PluginInput } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { join } from "path";

// Files to inject into agent context, in priority order
const CONTEXT_FILES = [
  "ARCHITECTURE.md",
  "CODE_STYLE.md",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
] as const;

// Cache for file contents to avoid repeated reads
interface ContextCache {
  content: Map<string, string>;
  lastCheck: number;
}

const CACHE_TTL = 30_000; // 30 seconds

export function createContextInjectorHook(ctx: PluginInput) {
  const cache: ContextCache = {
    content: new Map(),
    lastCheck: 0,
  };

  async function loadContextFiles(): Promise<Map<string, string>> {
    const now = Date.now();

    // Use cache if fresh
    if (now - cache.lastCheck < CACHE_TTL && cache.content.size > 0) {
      return cache.content;
    }

    cache.content.clear();
    cache.lastCheck = now;

    for (const filename of CONTEXT_FILES) {
      try {
        const filepath = join(ctx.directory, filename);
        const content = await readFile(filepath, "utf-8");
        if (content.trim()) {
          cache.content.set(filename, content);
        }
      } catch {
        // File doesn't exist or can't be read - skip
      }
    }

    return cache.content;
  }

  function formatContextBlock(files: Map<string, string>): string {
    if (files.size === 0) return "";

    const blocks: string[] = [];

    for (const [filename, content] of files) {
      blocks.push(`<context file="${filename}">\n${content}\n</context>`);
    }

    return `\n<project-context>\n${blocks.join("\n\n")}\n</project-context>\n`;
  }

  return {
    "chat.params": async (
      _input: { sessionID: string },
      output: { options?: Record<string, unknown>; system?: string }
    ) => {
      const files = await loadContextFiles();
      if (files.size === 0) return;

      const contextBlock = formatContextBlock(files);

      // Append context to system prompt
      if (output.system) {
        output.system = output.system + contextBlock;
      } else {
        output.system = contextBlock;
      }
    },
  };
}
