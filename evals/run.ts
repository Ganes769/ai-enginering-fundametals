import { tools } from "../src/tool";
import { SYSTEM_PROMPT } from "../src/system-prompts";
import { createOpenAI } from "@ai-sdk/openai";
import { join, dirname } from "node:path";
import { generateText, stepCountIs } from "ai";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { EvalResult, TestCase } from "./type";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Free-tier gpt-5.4-mini is often capped at 3 RPM — space requests accordingly. */
const MIN_REQUEST_INTERVAL_MS = Number(
  process.env.EVAL_MIN_REQUEST_INTERVAL_MS ?? 21_000,
);
const MAX_RATE_LIMIT_RETRIES = Number(process.env.EVAL_MAX_RETRIES ?? 8);

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRateLimitDelayMs(message: string): number | undefined {
  const secondsMatch = message.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (secondsMatch) {
    return Math.ceil(Number(secondsMatch[1]) * 1000) + 500;
  }
  const msMatch = message.match(/try again in (\d+)ms/i);
  if (msMatch) {
    return Number(msMatch[1]) + 500;
  }
}

async function throttleRequests() {
  const elapsed = Date.now() - lastRequestAt;
  const waitMs = MIN_REQUEST_INTERVAL_MS - elapsed;
  if (waitMs > 0) {
    process.stdout.write(`(waiting ${Math.ceil(waitMs / 1000)}s for rate limit) `);
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: async (url, options) => {
    for (let attempt = 0; attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
      await throttleRequests();
      const response = await fetch(url, options);
      if (response.status !== 429) {
        return response;
      }
      const body = await response.text();
      const waitMs =
        parseRateLimitDelayMs(body) ?? MIN_REQUEST_INTERVAL_MS;
      process.stdout.write(
        `(429, retry in ${Math.ceil(waitMs / 1000)}s) `,
      );
      await sleep(waitMs);
    }
    throw new Error("OpenAI rate limit persisted after retries");
  },
});

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /rate limit/i.test(message);
}

async function runTestCae(testcase: TestCase): Promise<EvalResult> {
  const start = Date.now();

  try {
    let results;
    for (let attempt = 0; attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
      try {
        results = await generateText({
          model: openai("gpt-5.4-mini"),
          system: SYSTEM_PROMPT,
          prompt: testcase.input,
          tools,
          stopWhen: stepCountIs(5),
          maxRetries: 0,
        });
        break;
      } catch (error: unknown) {
        if (!isRateLimitError(error) || attempt === MAX_RATE_LIMIT_RETRIES - 1) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        const waitMs =
          parseRateLimitDelayMs(message) ?? MIN_REQUEST_INTERVAL_MS;
        process.stdout.write(
          `(rate limited, retry in ${Math.ceil(waitMs / 1000)}s) `,
        );
        await sleep(waitMs);
      }
    }
    if (!results) {
      throw new Error("generateText did not return a result");
    }
    const elements = [];
    for (const step of results.steps) {
      for (const toolResults of step.toolResults) {
        if (toolResults.toolName === "generateDiagram") {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      testCaseId: testcase.id,
      input: testcase.input,
      response: "",
      elements: [],
      durationMs: Date.now() - start,
      error: message,
    };
  }
}

async function main() {
  const datasetPath = join(ROOT, "evals/datasets/golden.json");
  const testCases = JSON.parse(readFileSync(datasetPath, "utf-8"));
  console.log("Running", testCases.length, "test cases");
  console.log(
    `Rate-limit spacing: ${MIN_REQUEST_INTERVAL_MS}ms between API calls (set EVAL_MIN_REQUEST_INTERVAL_MS to override)`,
  );
  const results: EvalResult[] = [];
  for (const testCase of testCases) {
    process.stdout.write(`[${testCase.id}] ${testCase.difficulty.padEnd(6)} `);
    const result = await runTestCae(testCase);
    results.push(result);
    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else {
      console.log(`${result.elements.length} elements, ${result.durationMs}ms`);
    }
  }

  // Write the raw results to a timestamped file for manual scoring.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsDir = join(ROOT, "evals/results");
  mkdirSync(resultsDir, { recursive: true });
  const outPath = join(resultsDir, `${timestamp}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nResults written to ${outPath}`);
  console.log(
    `\nNext: open the file, review each result, and add score (1-5) and notes.`,
  );

  // Quick summary
  console.log("\n=== Summary ===");
  console.log(`Total: ${results.length}`);
  console.log(`Errors: ${results.filter((r) => r.error).length}`);
  console.log(
    `Empty results (no elements): ${results.filter((r) => !r.error && r.elements.length === 0).length}`,
  );
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length,
  );
  console.log(`Average duration: ${avgDuration}ms`);
}
main().catch((err) => {
  console.log(err);
  process.exit(1);
});
