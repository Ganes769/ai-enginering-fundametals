import { AIChatAgent } from "@cloudflare/ai-chat";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tool";
import { SYSTEM_PROMPT } from "./system-prompts";
import { streamAgent } from "./agent-core";

interface ENV {
  OPENAI_API_KEY: string;
}

export class DesignAgent extends AIChatAgent<ENV> {
  async onChatMessage() {
    const openai = createOpenAI({
      baseURL: "http://127.0.0.1:11434/v1",
      apiKey: "ollama",
    });

    const result = streamAgent({
      model: openai.chat("qwen2.5:7b"),

      messages: await convertToModelMessages(this.messages),
    });

    return result.toUIMessageStreamResponse();
  }
}
