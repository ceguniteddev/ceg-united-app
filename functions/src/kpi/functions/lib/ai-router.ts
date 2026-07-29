/**
 * functions/src/lib/ai-router.ts
 * ----------------------------------------------------------------------------
 * Swappable OpenAI <-> Claude abstraction, controlled by the AI_PROVIDER env
 * var ("openai" default, or "claude"). Used by ai-weekly-briefing.ts.
 *
 * Both providers are called with the same system + user prompt content —
 * only the SDK call and response parsing differ.
 *
 * Env vars:
 *   AI_PROVIDER        "openai" (default) | "claude"
 *   OPENAI_API_KEY     required if AI_PROVIDER=openai
 *   OPENAI_MODEL       optional, default "gpt-4o"
 *   ANTHROPIC_API_KEY  required if AI_PROVIDER=claude
 *   ANTHROPIC_MODEL    optional, default "claude-3-5-sonnet-20241022"
 * ----------------------------------------------------------------------------
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  provider: "openai" | "claude";
  model: string;
  text: string;
}

function getProvider(): "openai" | "claude" {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai" && provider !== "claude") {
    throw new Error(`Invalid AI_PROVIDER "${provider}" — must be "openai" or "claude".`);
  }
  return provider;
}

async function callOpenAI(req: AICompletionRequest): Promise<AICompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY (required when AI_PROVIDER=openai).");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    temperature: req.temperature ?? 0.4,
    max_tokens: req.maxTokens ?? 1500,
    messages: [
      { role: "system", content: req.systemPrompt },
      { role: "user", content: req.userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  return { provider: "openai", model, text };
}

async function callClaude(req: AICompletionRequest): Promise<AICompletionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY (required when AI_PROVIDER=claude).");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? 1500,
    temperature: req.temperature ?? 0.4,
    system: req.systemPrompt,
    messages: [{ role: "user", content: req.userPrompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return { provider: "claude", model, text };
}

/** Single entry point — routes to whichever provider is configured via AI_PROVIDER. */
export async function completeWithAI(req: AICompletionRequest): Promise<AICompletionResult> {
  const provider = getProvider();
  return provider === "openai" ? callOpenAI(req) : callClaude(req);
}
