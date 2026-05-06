import { AIChatAgent } from "@cloudflare/ai-chat";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tool";
import { extend } from "zod/mini";
import { SYSTEM_PROMPT } from "./system-prompts";
interface ENV {
  OPENAI_API_KEY: string;
}

export class DesignAgent extends AIChatAgent<ENV> {
  async onChatMessage() {
    const openai = createOpenAI({
      apiKey: this.onWorkflowEvent.OPENAI_API_KEY,
    });
    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools: {
        generateDiagram: tools.generateDiagram,
        modifyDiagram: tools.modifyDiagram,
      },
      stopWhen: stepCountIs(5),
      providerOptions: { openai: { stringJsonSchema: false } },
    });
    return result.toUIMessageStreamResponse();
  }
}
