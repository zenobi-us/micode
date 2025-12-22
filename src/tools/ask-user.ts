import { tool } from "@opencode-ai/plugin/tool";

export function createAskUserTool() {
  return tool({
    description: `Ask the user a question and wait for their response.
Use this when you need clarification, want to present options, or need user input before proceeding.
The user will respond in the chat.`,
    args: {
      question: tool.schema.string().describe("The question to ask the user"),
      options: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe("Optional list of choices (user can also provide custom answer)"),
      context: tool.schema
        .string()
        .optional()
        .describe("Optional context explaining why you're asking"),
    },
    execute: async (args) => {
      const { question, options, context } = args;

      let output = "---\n## Question for you\n\n";

      if (context) {
        output += `> ${context}\n\n`;
      }

      output += `**${question}**\n`;

      if (options && options.length > 0) {
        output += "\n";
        options.forEach((opt, i) => {
          output += `${i + 1}. ${opt}\n`;
        });
        output += "\n*Reply with a number or your own answer*";
      }

      output += "\n\n---";

      return output;
    },
  });
}
