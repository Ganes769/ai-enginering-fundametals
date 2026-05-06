import { tools } from "../src/tool";
import { SYSTEM_PROMPT } from "../src/system-prompts";
import { createOpenAI } from "@ai-sdk/openai";
import { join, dirname } from "node:path";
import { generateText, Output, stepCountIs } from "ai";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:js";
import { EvalResult, TestCase } from "./type";
import { RPCClientTransport } from "agents/mcp";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function runTestCae(testcase: TestCase): Promise<EvalResult> {
  const start = Date.now();

  try {
    const results = await generateText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      prompt: testcase.input,
      tools,
      stopWhen: stepCountIs(5),
    });
    const elements = [];
    for (const step of results.steps) {
      for (const toolResults of step.toolResults) {
        if (toolResults.toolName === "generatediagram") {
          const output = toolResults.output as any;
          if (Array.isArray(output?.elements)) {
            elements.push(...output.elements);
          }
        }
      }
    }
    return {
      testCaseId: testcase.id,
      input: testcase.input,
      response: results.text,
      elements,
      durationMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      testCaseId: testcase.id,
      input: testcase.input,
      response: "",
      elements: [],
      durationMs: 0,
    };
  }
}

async function main() {
  const datasetPath = join(ROOT, "evals/datasets/golden.json");
  const testCases = JSON.parse(readFileSync(datasetPath, "utf-8"));
  console.log("Running", testCases.length);
}
