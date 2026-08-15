import type { ReasoningModelName } from "@/types/funding-playbook";

export interface ReasoningPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ReasoningResult {
  model: ReasoningModelName;
  modelVersion: string;
  rawText: string;
  estimatedCostUsd: number;
  latencyMs: number;
}

export class ReasoningModelError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ReasoningModelError";
  }
}

function getConfiguredModel(): ReasoningModelName {
  const raw = (process.env.REASONING_MODEL ?? "gemini-2.5-pro")
    .toLowerCase()
    .trim();
  if (
    raw === "gpt-5" ||
    raw === "claude-sonnet-4.5" ||
    raw === "gemini-2.5-pro"
  ) {
    return raw;
  }
  return "gemini-2.5-pro";
}

export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

async function callGpt5(prompt: ReasoningPrompt): Promise<ReasoningResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ReasoningModelError("Missing OPENAI_API_KEY.");

  const model = process.env.OPENAI_MODEL ?? "gpt-5";
  const start = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: prompt.temperature ?? 0.3,
        max_tokens: prompt.maxOutputTokens ?? 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.systemPrompt },
          { role: "user", content: prompt.userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API returned status ${res.status}`);
    }

    const completion = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const rawText = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage;
    const estimatedCostUsd = usage
      ? (usage.prompt_tokens / 1_000_000) * 1.25 +
        (usage.completion_tokens / 1_000_000) * 10
      : 0.05;

    return {
      model: "gpt-5",
      modelVersion: model,
      rawText,
      estimatedCostUsd,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    throw new ReasoningModelError("OpenAI call failed", err);
  }
}

async function callClaudeSonnet(
  prompt: ReasoningPrompt,
): Promise<ReasoningResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReasoningModelError("Missing ANTHROPIC_API_KEY.");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250514";
  const start = Date.now();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: prompt.maxOutputTokens ?? 2000,
        temperature: prompt.temperature ?? 0.3,
        system: prompt.systemPrompt,
        messages: [{ role: "user", content: prompt.userPrompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API returned status ${res.status}`);
    }

    const message = (await res.json()) as {
      content: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const rawText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const estimatedCostUsd = message.usage
      ? (message.usage.input_tokens / 1_000_000) * 3 +
        (message.usage.output_tokens / 1_000_000) * 15
      : 0.08;

    return {
      model: "claude-sonnet-4.5",
      modelVersion: model,
      rawText,
      estimatedCostUsd,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    throw new ReasoningModelError("Anthropic call failed", err);
  }
}

async function callGeminiPro(
  prompt: ReasoningPrompt,
): Promise<ReasoningResult> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey)
    throw new ReasoningModelError(
      "Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.",
    );

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";
  const start = Date.now();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.systemPrompt }] },
        contents: [{ parts: [{ text: prompt.userPrompt }] }],
        generationConfig: {
          temperature: prompt.temperature ?? 0.3,
          maxOutputTokens: prompt.maxOutputTokens ?? 8000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Google Gemini API Error Body:", errorText);
      throw new Error(
        `Google Gemini API returned status ${res.status}: ${errorText}`,
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
      console.warn(`Gemini returned finishReason: ${candidate.finishReason}`);
    }

    const rawText = candidate?.content?.parts?.[0]?.text ?? "";
    const usage = data.usageMetadata;
    const estimatedCostUsd = usage
      ? ((usage.promptTokenCount ?? 0) / 1_000_000) * 1.25 +
        ((usage.candidatesTokenCount ?? 0) / 1_000_000) * 5
      : 0.03;

    return {
      model: "gemini-2.5-pro",
      modelVersion: modelName,
      rawText,
      estimatedCostUsd,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    throw new ReasoningModelError("Google Gemini call failed", err);
  }
}

export async function callReasoningModel(
  prompt: ReasoningPrompt,
): Promise<ReasoningResult> {
  const model = getConfiguredModel();
  switch (model) {
    case "gpt-5":
      return callGpt5(prompt);
    case "claude-sonnet-4.5":
      return callClaudeSonnet(prompt);
    case "gemini-2.5-pro":
    default:
      return callGeminiPro(prompt);
  }
}

export function getReasoningModelName(): ReasoningModelName {
  return getConfiguredModel();
}
