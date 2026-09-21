import { getSetting } from "../utils/settingsCache";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  customInstructions?: string;
  autoGenerateOnImport?: boolean;
}

export interface BanglaProductCopyInput {
  name: string;
  description?: string;
  code?: string;
  type?: string;
  category?: string;
}

export interface BanglaProductCopyResult {
  success: boolean;
  title: string;
  slug: string;
  description: string;
  highlights?: string[];
  modelUsed: string;
  message?: string;
}

const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it:free";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Retrieve OpenRouter configuration from Settings or fallback
 */
export async function getOpenRouterConfig(): Promise<OpenRouterConfig> {
  const settings = (await getSetting("openrouter_settings")) || {};
  const apiKey = (settings.apiKey || process.env.OPENROUTER_API_KEY || "").trim();
  const model = (settings.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL).trim();
  const customInstructions = (settings.customInstructions || "").trim();
  const autoGenerateOnImport = settings.autoGenerateOnImport !== false;

  return { apiKey, model, customInstructions, autoGenerateOnImport };
}

/**
 * Test OpenRouter connection with API Key and Model
 */
export async function testOpenRouterConnection(
  apiKeyParam?: string,
  modelParam?: string
): Promise<{ success: boolean; message: string; model: string; response?: string }> {
  const config = await getOpenRouterConfig();
  const apiKey = (apiKeyParam || config.apiKey).trim();
  const model = (modelParam || config.model || DEFAULT_MODEL).trim();

  if (!apiKey) {
    return {
      success: false,
      message: "OpenRouter API Key is missing. Please enter a valid OpenRouter API Key.",
      model,
    };
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://kalobazar.shop",
        "X-Title": "Kalobazar Admin AI Test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: "Respond with only the single word: OK",
          },
        ],
        max_tokens: 15,
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errDetail = data.error?.message || `HTTP ${response.status} ${response.statusText}`;
      return {
        success: false,
        message: `OpenRouter error: ${errDetail}`,
        model,
      };
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "OK";
    return {
      success: true,
      message: `Connection successful with model ${model}! Response: "${reply}"`,
      model,
      response: reply,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Network error connecting to OpenRouter: ${error.message}`,
      model,
    };
  }
}

/**
 * Generate Bangla marketing title, slug, and compelling description from product details
 */
export async function generateBanglaProductCopy(
  input: BanglaProductCopyInput,
  customApiKey?: string,
  customModel?: string
): Promise<BanglaProductCopyResult> {
  const config = await getOpenRouterConfig();
  const apiKey = (customApiKey || config.apiKey).trim();
  const model = (customModel || config.model || DEFAULT_MODEL).trim();

  if (!apiKey) {
    throw new Error(
      "OpenRouter API Key is not configured. Please add your OpenRouter token in Admin Settings > AI Configuration."
    );
  }

  if (!input.name || !input.name.trim()) {
    throw new Error("Product name is required for AI copy generation.");
  }

  const systemPrompt = `You are an expert e-commerce copywriter and marketing specialist for "Kalobazar.shop" (কালোবাজার), a trusted digital store in Bangladesh offering premium subscriptions, software licenses, digital accounts, and developer tools.

Target Audience: Bangladeshi freelancers, students, digital marketers, software developers, and professionals who want reliable, official, and instant digital services with local payment (bKash/Nagad).

Your Task:
Transform the raw upstream product information into an irresistible, highly professional marketing listing tailored for Bangladeshi buyers.

Language: Natural, fluent, persuasive Bengali (বাংলা ভাষা). Essential brand names, technical terms, and validity periods should remain in English/transliteration for clarity (e.g., "Canva Pro 1 Year", "Chat GPT Plus", "VPN").

CRITICAL FORMATTING INSTRUCTION:
You must respond with ONLY a valid JSON object (no extra commentary, no preamble, no markdown code block surrounding the JSON if possible, or inside a clean \`\`\`json block).

The JSON object must have this exact structure:
{
  "title": "A compelling Bangla marketing title mentioning product brand and duration in English/Bangla (e.g. ক্যানভা প্রো ১ বছর সাবস্ক্রিপশন (Canva Pro 1 Year))",
  "slug": "clean-english-url-slug-using-only-lowercase-letters-numbers-and-hyphens",
  "highlights": [
    "৩-৪টি প্রধান আকর্ষণীয় সুবিধা বাংলায় সংক্ষেপে বুলেট পয়েন্ট আকারে"
  ],
  "description": "A comprehensive, high-converting product description in standard Bengali using rich Markdown headings and bullet points. Must include:\\n\\n### 📌 পণ্য পরিচিতি (What the product/service does)\\n### ⚡ মূল বৈশিষ্ট্য ও প্রিমিয়াম সুবিধাসমূহ (Key benefits and unlocked pro features)\\n### 🚀 ইনস্ট্যান্ট ডেলিভারি প্রক্রিয়া (Instant automated delivery upon bKash/Nagad payment)\\n### 🛡️ অফিসিয়াল ওয়ারেন্টি ও হেল্পলাইন (Full validity warranty and WhatsApp support)\\n### 💡 কেন Kalobazar.shop থেকে নিবেন? (100% verified, secure & best rate in Bangladesh)"
}
${config.customInstructions ? `\nAdditional Custom Instruction: ${config.customInstructions}` : ""}`;

  const userPrompt = `Please write marketing copy in Bengali for this upstream product:
- Product Name: ${input.name}
- Upstream Code/Variant: ${input.code || "N/A"}
- Product Type: ${input.type || "Digital Account / Subscription"}
- Category: ${input.category || "Digital Service"}
- Upstream Description / Details:
${input.description || "Official digital subscription with instant activation."}

Generate the JSON output now:`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://kalobazar.shop",
      "X-Title": "Kalobazar Product Importer",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 1800,
    }),
  });

  const rawData = await response.json();

  if (!response.ok || rawData.error) {
    const errorMsg = rawData.error?.message || `OpenRouter HTTP ${response.status}`;
    throw new Error(`OpenRouter generation failed: ${errorMsg}`);
  }

  const rawContent = rawData.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error("OpenRouter returned an empty response.");
  }

  // Robust JSON parser for LLM response
  const parsed = parseLLMJsonResponse(rawContent, input.name);

  return {
    success: true,
    title: parsed.title,
    slug: parsed.slug,
    description: parsed.description,
    highlights: parsed.highlights || [],
    modelUsed: model,
  };
}

/**
 * Helper to reliably parse JSON from various LLM response formats
 */
function parseLLMJsonResponse(
  content: string,
  fallbackName: string
): { title: string; slug: string; description: string; highlights?: string[] } {
  // 1. Try direct parse
  try {
    const direct = JSON.parse(content);
    if (direct.title && direct.description) {
      return sanitizeParsedCopy(direct, fallbackName);
    }
  } catch (_) {}

  // 2. Try extracting from markdown code block ```json ... ``` or ``` ... ```
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const fromBlock = JSON.parse(codeBlockMatch[1].trim());
      if (fromBlock.title && fromBlock.description) {
        return sanitizeParsedCopy(fromBlock, fallbackName);
      }
    } catch (_) {}
  }

  // 3. Try finding first { and last }
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const extracted = JSON.parse(content.substring(firstBrace, lastBrace + 1));
      if (extracted.title || extracted.description) {
        return sanitizeParsedCopy(extracted, fallbackName);
      }
    } catch (_) {}
  }

  // 4. Graceful fallback if JSON parsing failed completely
  console.warn("[OpenRouter] Could not parse strictly structured JSON, constructing fallback copy.");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.replace(/^#+\s*/, "").replace(/^"|"$/g, "") || `${fallbackName} (অফিশিয়াল সাবস্ক্রিপশন)`;
  const slug = generateCleanSlug(fallbackName);
  const description = lines.slice(1).join("\n\n") || content;

  return {
    title,
    slug,
    description,
    highlights: [],
  };
}

function sanitizeParsedCopy(
  data: any,
  fallbackName: string
): { title: string; slug: string; description: string; highlights?: string[] } {
  const title = String(data.title || fallbackName).trim();
  const slug = generateCleanSlug(data.slug || title || fallbackName);
  const description = String(data.description || "").trim();
  const highlights = Array.isArray(data.highlights)
    ? data.highlights.map((h: any) => String(h).trim()).filter(Boolean)
    : [];

  return {
    title,
    slug,
    description,
    highlights,
  };
}

function generateCleanSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^\w\s-]/g, "") // remove special chars
    .replace(/[\s_-]+/g, "-") // replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, "") // trim hyphens
    .slice(0, 80) || "digital-product";
}
