import Groq from "groq-sdk";
import { z } from "zod";
import { config } from "../config.js";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENTS, HttpError, toMinor } from "../lib/domain.js";

let client;
const groq = () => {
  if (!config.groqApiKey) throw new HttpError(503, "AI features are not configured on this server", "AI_UNAVAILABLE");
  client ??= new Groq({ apiKey: config.groqApiKey, timeout: 30_000, maxRetries: 1 });
  return client;
};

/** One chat completion that must return a JSON object; Groq failures become friendly HTTP errors. */
async function chatJson({ model, messages, reasoning = false }) {
  let completion;
  try {
    completion = await groq().chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
      ...(reasoning && { reasoning_effort: "low" }),
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err?.status === 429)
      throw new HttpError(429, "The AI is busy right now. Try again in a minute.", "AI_RATE_LIMITED");
    console.error("Groq request failed:", err?.status, err?.message);
    throw new HttpError(502, "The AI service could not answer. Please try again.", "AI_FAILED");
  }
  const text = completion.choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new HttpError(502, "The AI returned an unreadable answer. Please try again.", "AI_FAILED");
  }
}

const insightSchema = z.object({
  insights: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        detail: z.string().min(1).max(400),
        tone: z.enum(["positive", "neutral", "warning"]).catch("neutral"),
      }),
    )
    .min(1)
    .max(5),
});

/**
 * Asks the text model for spending insights. Only aggregated totals are sent
 * (no notes, names or individual transactions).
 */
export async function generateInsights(aggregate) {
  const data = await chatJson({
    model: config.groqTextModel,
    reasoning: true,
    messages: [
      {
        role: "system",
        content:
          "You are a careful personal finance coach. You receive one user's aggregated monthly figures as JSON. " +
          "Amounts are already in major currency units. Return exactly 4 specific, actionable insights grounded only in the numbers given; " +
          "quote concrete figures with the currency code, compare with last month when useful, never invent data, never recommend specific investments. " +
          'Reply with JSON only: {"insights":[{"title":"short headline","detail":"1-2 sentences","tone":"positive|neutral|warning"}]}',
      },
      { role: "user", content: JSON.stringify(aggregate) },
    ],
  });
  const parsed = insightSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(502, "The AI returned an unexpected answer. Please try again.", "AI_FAILED");
  return parsed.data.insights;
}

/** Normalizes model output into a draft transaction the user reviews before saving. */
export function normalizeReceipt(raw) {
  const type = raw?.type === "income" ? "income" : "expense";
  const allowed = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const category = allowed.includes(String(raw?.category).toLowerCase()) ? String(raw.category).toLowerCase() : "other";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw?.date) && !Number.isNaN(Date.parse(raw.date)) ? raw.date : null;
  const payment = PAYMENTS.includes(raw?.payment) ? raw.payment : null;
  const amountMinor = toMinor(String(raw?.amount ?? "").replace(/,/g, ""));
  return {
    type,
    category,
    amountMinor: amountMinor > 0 ? amountMinor : null,
    date,
    payment,
    note: typeof raw?.note === "string" ? raw.note.slice(0, 120) : null,
  };
}

export async function scanReceipt(buffer, mimeType) {
  const raw = await chatJson({
    model: config.groqVisionModel,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Extract the transaction from this receipt. Reply with JSON only: " +
              '{"type":"expense|income","amount":"total as a decimal string","date":"YYYY-MM-DD or null",' +
              `"category":"one of ${EXPENSE_CATEGORIES.join(", ")}","payment":"${PAYMENTS.join("|")}|null","note":"merchant and short description"}`,
          },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
        ],
      },
    ],
  });
  return normalizeReceipt(raw);
}
