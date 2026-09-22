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

// Known fallback models when an upstream free provider is rate-limited
const FREE_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nex-agi/nex-n2.5-pro:free",
  "z-ai/glm-5.2:free",
  "qwen/qwen3.8-27b:free",
];

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
      const rawDetail = data.error?.metadata?.raw;
      const errDetail = rawDetail || data.error?.message || `HTTP ${response.status} ${response.statusText}`;
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
  const primaryModel = (customModel || config.model || DEFAULT_MODEL).trim();

  if (!apiKey) {
    throw new Error(
      "OpenRouter API Key is not configured. Please add your OpenRouter token in Admin Settings > OpenRouter AI."
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
  "description": "Clean, ready-to-render semantic HTML formatted description in Bengali. DO NOT use raw markdown hashes like ###. Use clean HTML tags: <h3>, <p>, <ul>, <li>, and <strong>. Must include:\\n<h3>📌 পণ্য পরিচিতি</h3>\\n<p>পণ্য পরিচিতি ও এটি কীভাবে ব্যবহারকারীর কাজে লাগবে...</p>\\n<h3>⚡ মূল বৈশিষ্ট্য ও প্রিমিয়াম সুবিধাসমূহ</h3>\\n<ul>\\n  <li><strong>সুবিধা ১:</strong> বিস্তারিত বিবরণ</li>\\n  <li><strong>সুবিধা ২:</strong> বিস্তারিত বিবরণ</li>\\n</ul>\\n<h3>🚀 ইনস্ট্যান্ট ডেলিভারি প্রক্রিয়া</h3>\\n<p>bKash/Nagad পেমেন্টের সাথে সাথেই স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ও এক্সেস ডেলিভারি করা হয়।</p>\\n<h3>🛡️ অফিসিয়াল ওয়ারেন্টি ও হেল্পলাইন</h3>\\n<p>সম্পূর্ণ মেয়াদকালীন অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি এবং WhatsApp হেল্পলাইন সাপোর্ট।</p>\\n<h3>💡 কেন Kalobazar.shop থেকে নিবেন?</h3>\\n<ul>\\n  <li><strong>১০০% ভেরিফাইড:</strong> কোনো ইনভ্যালিড এক্সেসের ভয় নেই।</li>\\n  <li><strong>সেরা মূল্য:</strong> বাংলাদেশে সবচেয়ে সাশ্রয়ী মূল্যে ডিজিটাল সার্ভিস।</li>\\n</ul>"
}
${config.customInstructions ? `\nAdditional Custom Instruction: ${config.customInstructions}` : ""}`;

  const userPrompt = `Please write marketing copy in Bengali for this upstream product:
- Product Name: ${input.name}
- Upstream Code/Variant: ${input.code || "N/A"}
- Product Type: ${input.type || "Digital Account / Subscription"}
- Category: ${input.category || "Digital Service"}
- Upstream Description / Details:
${input.description || "Official digital subscription with instant activation."}

FORMAT REQUIREMENT:
The "description" field MUST be output as clean semantic HTML using <h3>, <p>, <ul>, <li>, and <strong> tags. Do NOT output raw markdown hashes (###) or unformatted plain text.

Generate the JSON output now:`;

  // Build candidate model list (primary model first, followed by fallbacks if free tier)
  const candidateModels = [primaryModel];
  if (primaryModel.endsWith(":free")) {
    for (const fb of FREE_FALLBACK_MODELS) {
      if (!candidateModels.includes(fb)) {
        candidateModels.push(fb);
      }
    }
  }

  // Use unified prompt for maximum compatibility across all providers
  const unifiedPrompt = `${systemPrompt}\n\n====================\n\n${userPrompt}`;
  const messages = [
    { role: "user", content: unifiedPrompt },
  ];

  let lastErrorMsg = "";

  for (const model of candidateModels) {
    try {
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
          messages,
          temperature: 0.65,
          max_tokens: 1800,
        }),
      });

      const rawData = await response.json();

      if (response.ok && !rawData.error && rawData.choices?.[0]?.message?.content) {
        const rawContent = rawData.choices[0].message.content.trim();
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

      if (rawData.error) {
        const rawDetail = rawData.error?.metadata?.raw;
        lastErrorMsg = rawDetail
          ? `${rawData.error.message || "Provider error"}: ${rawDetail}`
          : rawData.error?.message || `OpenRouter HTTP ${response.status}`;
        console.warn(`[OpenRouter] Model "${model}" failed: ${lastErrorMsg}`);
      }
    } catch (err: any) {
      lastErrorMsg = err.message;
      console.warn(`[OpenRouter] Network error on model "${model}":`, err.message);
    }
  }

  throw new Error(`OpenRouter generation failed: ${lastErrorMsg}`);
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
    description: ensureFormattedHtml(description),
    highlights: [],
  };
}

function sanitizeParsedCopy(
  data: any,
  fallbackName: string
): { title: string; slug: string; description: string; highlights?: string[] } {
  const title = String(data.title || fallbackName).trim();
  const slug = generateCleanSlug(data.slug || title || fallbackName);
  const description = ensureFormattedHtml(String(data.description || "").trim());
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

/**
 * Ensures a text string is cleanly formatted as semantic HTML.
 * If already containing semantic tags (<h3>, <p>, <ul>, etc.), it normalizes bold tags.
 * If markdown or plain text, converts headings and bullet points into semantic HTML.
 */
export function ensureFormattedHtml(text: string): string {
  if (!text || !text.trim()) return "";

  const replaceBold = (str: string) => str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // If already contains structural HTML tags
  if (/<(?:h[1-6]|p|ul|ol|li|div|br)\b[^>]*>/i.test(text)) {
    return replaceBold(text.trim());
  }

  const lines = text.split(/\r?\n/);
  const parts: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Heading: ### Heading or ## Heading or # Heading
    if (/^#+\s+/.test(line)) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      const heading = line.replace(/^#+\s*/, "").trim();
      parts.push(`<h3>${heading}</h3>`);
      continue;
    }

    // Bullet item: - item, * item, • item, or starting with ✅
    if (/^[-*•]\s+/.test(line) || /^✅\s+/.test(line)) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      const itemText = line.replace(/^[-*•]\s*/, "").trim();
      parts.push(`<li>${replaceBold(itemText)}</li>`);
      continue;
    }

    // Normal paragraph
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
    parts.push(`<p>${replaceBold(line)}</p>`);
  }

  if (inList) {
    parts.push("</ul>");
  }

  return parts.join("\n");
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
