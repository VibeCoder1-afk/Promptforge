/**
 * Unified AI provider layer.
 * Each provider exposes: run({ prompt, jsonMode }) -> { output, tokensInput, tokensOutput, latencyMs }
 * Falls back to a clearly-labeled mock response when a provider's API key is not configured,
 * so the whole app is demoable locally without any billing set up.
 */

// Approximate public per-1K-token pricing (USD). Update as providers change pricing.
// Groq and Mistral defaults below are on each provider's free tier ($0), so cost shows as $0.0000
// unless you point DEFAULT_MODEL at one of their paid models.
const PRICING = {
  groq: { "llama-3.3-70b-versatile": { in: 0, out: 0 }, "llama-3.1-8b-instant": { in: 0, out: 0 } },
  gemini: { "gemini-3.6-flash": { in: 0, out: 0 }, "gemini-flash-latest": { in: 0, out: 0 }, "gemini-2.5-flash": { in: 0, out: 0 }, "gemini-2.5-flash-lite": { in: 0, out: 0 } },
  mistral: { "mistral-small-latest": { in: 0, out: 0 }, "open-mistral-nemo": { in: 0, out: 0 } },
};

const DEFAULT_MODEL = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-3.6-flash",
  mistral: "mistral-small-latest",
};

function renderTemplate(content, variableValues = {}) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(variableValues, key) ? String(variableValues[key]) : `{{${key}}}`
  );
}

function estimateTokens(text = "") {
  // Rough heuristic (~4 chars/token) used only for the mock path; real calls use provider usage data.
  return Math.max(1, Math.ceil(text.length / 4));
}

function calcCost(provider, model, tokensInput, tokensOutput) {
  const table = PRICING[provider]?.[model];
  if (!table) return 0;
  return +((tokensInput / 1000) * table.in + (tokensOutput / 1000) * table.out).toFixed(6);
}

async function runGroq(rendered, { jsonMode, model }) {
  const key = process.env.GROQ_API_KEY;
  const chosenModel = model || DEFAULT_MODEL.groq;
  if (!key) return mockRun("groq", chosenModel, rendered, jsonMode);

  // Groq's API is OpenAI-compatible, so we reuse the `openai` SDK pointed at Groq's base URL.
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
  const start = Date.now();
  const resp = await client.chat.completions.create({
    model: chosenModel,
    messages: [{ role: "user", content: rendered }],
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  const latencyMs = Date.now() - start;
  return {
    output: resp.choices[0]?.message?.content || "",
    tokensInput: resp.usage?.prompt_tokens || estimateTokens(rendered),
    tokensOutput: resp.usage?.completion_tokens || 0,
    latencyMs,
    model: chosenModel,
  };
}

// Google has been retiring/renaming free-tier Gemini models with little notice (e.g. gemini-2.5-flash
// started 404ing for some accounts in July 2026 ahead of its official Oct 2026 shutdown date). To avoid
// this whole app breaking every time that happens, try the requested model first, then fall back through
// a short list of other current free-tier-eligible names if it 404s as "no longer available".
const GEMINI_FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

async function runGemini(rendered, { jsonMode, model }) {
  const key = process.env.GEMINI_API_KEY;
  const chosenModel = model || DEFAULT_MODEL.gemini;
  if (!key) return mockRun("gemini", chosenModel, rendered, jsonMode);

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);

  const candidates = [chosenModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== chosenModel)];
  let lastErr;
  for (const candidateModel of candidates) {
    try {
      const genModel = genAI.getGenerativeModel({
        model: candidateModel,
        ...(jsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {}),
      });
      const start = Date.now();
      const result = await genModel.generateContent(rendered);
      const latencyMs = Date.now() - start;
      const usage = result.response.usageMetadata || {};
      return {
        output: result.response.text(),
        tokensInput: usage.promptTokenCount || estimateTokens(rendered),
        tokensOutput: usage.candidatesTokenCount || 0,
        latencyMs,
        model: candidateModel,
      };
    } catch (err) {
      lastErr = err;
      // Fall through to the next candidate for two cases:
      // (1) the model was retired/renamed (404), or
      // (2) it's temporarily overloaded (503) — common right after a new model launches.
      // Anything else (bad key, quota exceeded, network) should surface immediately.
      const retryable =
        err?.status === 404 ||
        err?.status === 503 ||
        /not found|no longer available|overloaded|unavailable|high demand/i.test(err?.message || "");
      if (!retryable) throw err;
    }
  }
  throw lastErr;
}

async function runMistral(rendered, { jsonMode, model }) {
  const key = process.env.MISTRAL_API_KEY;
  const chosenModel = model || DEFAULT_MODEL.mistral;
  if (!key) return mockRun("mistral", chosenModel, rendered, jsonMode);

  // Mistral's chat completions endpoint is OpenAI-shaped, so a plain fetch is enough (no SDK needed).
  const start = Date.now();
  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: chosenModel,
      messages: [{ role: "user", content: rendered }],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || `Mistral API error (${resp.status})`);
  const latencyMs = Date.now() - start;
  return {
    output: data.choices?.[0]?.message?.content || "",
    tokensInput: data.usage?.prompt_tokens || estimateTokens(rendered),
    tokensOutput: data.usage?.completion_tokens || 0,
    latencyMs,
    model: chosenModel,
  };
}

function mockRun(provider, model, rendered, jsonMode) {
  const latencyMs = 300 + Math.floor(Math.random() * 700);
  const output = jsonMode
    ? JSON.stringify({ note: `Mock ${provider} response — add ${provider.toUpperCase()}_API_KEY to go live`, promptPreview: rendered.slice(0, 120) }, null, 2)
    : `[Mock ${provider} response — set ${provider.toUpperCase()}_API_KEY in .env to call the real API]\n\nPrompt received:\n${rendered.slice(0, 300)}`;
  return {
    output,
    tokensInput: estimateTokens(rendered),
    tokensOutput: estimateTokens(output),
    latencyMs,
    model,
    mocked: true,
  };
}

const RUNNERS = { groq: runGroq, gemini: runGemini, mistral: runMistral };

async function runPrompt({ provider, model, content, variableValues, jsonMode }) {
  if (!RUNNERS[provider]) throw new Error(`Unknown provider: ${provider}`);
  const rendered = renderTemplate(content, variableValues);
  const result = await RUNNERS[provider](rendered, { jsonMode, model });
  const costUsd = calcCost(provider, result.model, result.tokensInput, result.tokensOutput);

  let isJsonValid = null;
  if (jsonMode) {
    try {
      JSON.parse(result.output);
      isJsonValid = true;
    } catch {
      isJsonValid = false;
    }
  }

  return { ...result, renderedPrompt: rendered, costUsd, isJsonValid };
}

/**
 * Heuristic prompt score (0-100 each axis). This is a lightweight static analysis of the
 * prompt text, not a model judgement — it's meant to give directional feedback in the editor,
 * clearly labeled as a heuristic in the UI.
 */
function scorePrompt(content) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const len = words.length;

  const hasExamples = /example|e\.g\.|for instance/i.test(content);
  const hasFormatSpec = /format|json|markdown|bullet|list|structure/i.test(content);
  const hasRole = /you are|act as|as a/i.test(content);
  const vagueWords = (content.match(/\b(something|stuff|things|maybe|kind of|etc\.?)\b/gi) || []).length;

  const clarity = Math.max(10, Math.min(100, 50 + (hasRole ? 15 : 0) + (len > 8 ? 10 : -10) - vagueWords * 8));
  const specificity = Math.max(10, Math.min(100, 40 + (hasExamples ? 20 : 0) + (hasFormatSpec ? 20 : 0) + Math.min(20, len / 3)));
  const outputConsistency = Math.max(10, Math.min(100, 45 + (hasFormatSpec ? 25 : 0) + (hasExamples ? 15 : 0)));
  const hallucinationRisk = Math.max(5, Math.min(100, 60 - (hasExamples ? 15 : 0) - (hasFormatSpec ? 10 : 0) + (len < 5 ? 20 : 0)));

  return {
    clarity: Math.round(clarity),
    specificity: Math.round(specificity),
    outputConsistency: Math.round(outputConsistency),
    hallucinationRisk: Math.round(hallucinationRisk), // higher = riskier
  };
}

module.exports = { runPrompt, renderTemplate, scorePrompt, calcCost, PRICING, DEFAULT_MODEL };
