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

const DEFAULT_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// High-speed fallback models with rapid token generation (1-3s response time & natural Bengali)
const FAST_FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "qwen/qwen3-30b-a3b-instruct-2507",
  "deepseek/deepseek-chat",
];

// Fallback models when free tier is explicitly requested
const FREE_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
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
      signal: AbortSignal.timeout(8000),
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

  const systemPrompt = `You are an expert e-commerce copywriter for "Kalobazar.shop" (কালোবাজার), a trusted digital store in Bangladesh offering premium subscriptions, software licenses, digital accounts, and developer tools.

Target Audience: Bangladeshi freelancers, students, digital marketers, software developers, and professionals who want reliable, official, and instant digital services with local payment (bKash/Nagad).

Your Task:
Transform the raw product information into an irresistible, concise, high-converting marketing listing in natural, fluent Bengali (বাংলা). Essential brand names, technical terms, and validity periods should remain in English/transliteration for clarity (e.g., "Canva Pro 1 Year", "ChatGPT Plus", "VPN").

SPEED & CONCISENESS REQUIREMENT:
Write concise, punchy, high-converting copy (under 250 words total). Avoid long repetitive essays or bloated paragraphs. Focus on instant value, key features, and buyer peace of mind.

CRITICAL FORMATTING INSTRUCTION:
You must respond with ONLY a valid, parseable JSON object matching this exact schema:
{
  "title": "A compelling Bangla marketing title mentioning product brand and duration in English/Bangla (e.g. ক্যানভা প্রো ১ বছর সাবস্ক্রিপশন (Canva Pro 1 Year))",
  "slug": "clean-english-url-slug-using-only-lowercase-letters-numbers-and-hyphens",
  "highlights": [
    "৩-৪টি প্রধান আকর্ষণীয় সুবিধা বাংলায় সংক্ষেপে বুলেট পয়েন্ট আকারে"
  ],
  "description": "📌 পণ্য পরিচিতি\\nসংক্ষিপ্ত পরিচিতি ও কীভাবে কাজে লাগবে...\\n\\n⚡ মূল বৈশিষ্ট্যসমূহ\\n- সুবিধা ১\\n- সুবিধা ২\\n- সুবিধা ৩\\n\\n🚀 ইনস্ট্যান্ট ডেলিভারি\\nbKash/Nagad পেমেন্টের সাথে সাথেই স্বয়ংক্রিয়ভাবে এক্সেস শুরু হয়।\\n\\n🛡️ অফিসিয়াল ওয়ারেন্টি ও হেল্পলাইন\\nসম্পূর্ণ মেয়াদকালীন অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি এবং WhatsApp হেল্পলাইন সাপোর্ট।\\n\\n💡 কেন Kalobazar.shop থেকে নিবেন?\\n- ১০০% ভেরিফাইড ও নিরাপদ সার্ভিস\\n- বাংলাদেশে সবচেয়ে সাশ্রয়ী মূল্য"
}

IMPORTANT:
- In "description", organize into these 5 clear sections with emojis (📌 পণ্য পরিচিতি, ⚡ মূল বৈশিষ্ট্যসমূহ, 🚀 ইনস্ট্যান্ট ডেলিভারি, 🛡️ অফিসিয়াল ওয়ারেন্টি, 💡 কেন Kalobazar.shop থেকে নিবেন?).
- Use bullet points (- point) for features.
- Escape all double quotes inside text as \\\" or use single quotes ('). Do NOT leave raw unescaped double quotes.
${config.customInstructions ? `\nAdditional Custom Instruction: ${config.customInstructions}` : ""}`;

  const userPrompt = `Please write marketing copy in Bengali for this upstream product:
- Product Name: ${input.name}
- Upstream Code/Variant: ${input.code || "N/A"}
- Product Type: ${input.type || "Digital Account / Subscription"}
- Category: ${input.category || "Digital Service"}
- Upstream Description / Details:
${input.description || "Official digital subscription with instant activation."}

Generate the JSON output now:`;

  // Build candidate model list (primary model first, followed by fallbacks)
  const candidateModels = [primaryModel];
  if (primaryModel.endsWith(":free")) {
    for (const fb of FREE_FALLBACK_MODELS) {
      if (!candidateModels.includes(fb)) {
        candidateModels.push(fb);
      }
    }
  } else {
    for (const fb of FAST_FALLBACK_MODELS) {
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
          temperature: 0.4,
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(12000),
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
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
      lastErrorMsg = isTimeout
        ? `Model "${model}" timed out after 12s, switching to fast fallback`
        : err.message;
      console.warn(`[OpenRouter] Error on model "${model}": ${lastErrorMsg}`);
    }
  }

  throw new Error(`OpenRouter generation failed: ${lastErrorMsg}`);
}

/**
 * Safely sanitizes unescaped control characters and unescaped newlines inside JSON strings
 */
export function sanitizeJsonControlChars(str: string): string {
  let inString = false;
  let escaped = false;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
      out += char;
    } else if (inString) {
      if (char === "\n") {
        out += "\\n";
      } else if (char === "\r") {
        // omit carriage return
      } else if (char === "\t") {
        out += "\\t";
      } else if (char.charCodeAt(0) < 0x20) {
        out += " ";
      } else {
        out += char;
      }
    } else {
      out += char;
    }
    escaped = char === "\\" && !escaped;
  }
  return out;
}

/**
 * Helper to reliably parse JSON from various LLM response formats
 */
function parseLLMJsonResponse(
  content: string,
  fallbackName: string
): { title: string; slug: string; description: string; highlights?: string[] } {
  let clean = content.trim();

  // 1. Strip markdown codeblock ```json ... ``` or ``` ... ```
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    clean = codeBlockMatch[1].trim();
  }

  // 2. Try direct parse
  try {
    const direct = JSON.parse(clean);
    if (direct && (direct.title || direct.description)) {
      return sanitizeParsedCopy(direct, fallbackName);
    }
  } catch (_) {}

  // 3. Try parsing with sanitized control characters
  try {
    const sanitized = sanitizeJsonControlChars(clean);
    const parsed = JSON.parse(sanitized);
    if (parsed && (parsed.title || parsed.description)) {
      return sanitizeParsedCopy(parsed, fallbackName);
    }
  } catch (_) {}

  // 4. Try finding substring from first { to last }
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = clean.substring(firstBrace, lastBrace + 1);
    try {
      const sanitizedSub = sanitizeJsonControlChars(jsonSub);
      const parsed = JSON.parse(sanitizedSub);
      if (parsed && (parsed.title || parsed.description)) {
        return sanitizeParsedCopy(parsed, fallbackName);
      }
    } catch (_) {}
  }

  // 5. Robust Regex / Key-Value Extraction (handles unescaped quotes or truncated JSON)
  console.warn("[OpenRouter] Standard JSON.parse failed, running field extraction regex.");
  let title = "";
  let slug = "";
  let description = "";
  let highlights: string[] = [];

  const titleMatch = clean.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || clean.match(/"title"\s*:\s*"(.*?)"/i);
  if (titleMatch) title = titleMatch[1];

  const slugMatch = clean.match(/"slug"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || clean.match(/"slug"\s*:\s*"(.*?)"/i);
  if (slugMatch) slug = slugMatch[1];

  const highlightsMatch = clean.match(/"highlights"\s*:\s*\[([\s\S]*?)\]/i);
  if (highlightsMatch) {
    const rawItems = highlightsMatch[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
    if (rawItems) {
      highlights = rawItems.map((item) => item.slice(1, -1).trim()).filter(Boolean);
    }
  }

  // Extract description: everything after "description": " until closing quote before another key or end
  const descMatch = clean.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\}|\s*\}\s*$|"$)/i) ||
                    clean.match(/"description"\s*:\s*"([\s\S]*)/i);
  if (descMatch) {
    description = descMatch[1].replace(/"?\s*\}?\s*$/, "").trim();
  }

  // If description was successfully extracted, return it!
  if (description) {
    return {
      title: title || `${fallbackName} (অফিশিয়াল সাবস্ক্রিপশন)`,
      slug: generateCleanSlug(slug || title || fallbackName),
      description: ensureFormattedHtml(description),
      highlights,
    };
  }

  // 6. Graceful fallback for non-JSON plain text response
  console.warn("[OpenRouter] Non-JSON LLM response, parsing lines.");
  const strippedText = clean
    .replace(/^\{?\s*"title"\s*:\s*"/i, "")
    .replace(/^\{|\}$/g, "")
    .trim();

  const lines = strippedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  title = lines[0]?.replace(/^#+\s*/, "").replace(/^"|"$/g, "") || `${fallbackName} (অফিশিয়াল সাবস্ক্রিপশন)`;
  slug = generateCleanSlug(fallbackName);
  const remainingText = lines.slice(1).join("\n\n") || strippedText;

  return {
    title,
    slug,
    description: ensureFormattedHtml(remainingText),
    highlights,
  };
}

function sanitizeParsedCopy(
  data: any,
  fallbackName: string
): { title: string; slug: string; description: string; highlights?: string[] } {
  const rawTitle = String(data.title || fallbackName).trim();
  const title = rawTitle.replace(/^\{?\s*"title"\s*:\s*"?/i, "").replace(/"?[,}]?\s*$/, "").trim();
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
 * If markdown or plain text with emoji headings, converts into beautiful semantic HTML.
 */
export function ensureFormattedHtml(text: string): string {
  if (!text || !text.trim()) return "";

  // 1. Unescape literal \n or \r
  let str = text.replace(/\\n/g, "\n").replace(/\\r/g, "").trim();

  // 2. If the text itself is accidentally a JSON string, extract the description
  if (str.startsWith("{") || /"description"\s*:/i.test(str)) {
    const descMatch = str.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\}|\s*\}\s*$|"$)/i) ||
                      str.match(/"description"\s*:\s*"([\s\S]*)/i);
    if (descMatch) {
      str = descMatch[1].replace(/"?\s*\}?\s*$/, "").replace(/\\n/g, "\n").trim();
    }
  }

  // Remove any stray JSON tokens or quotes at boundaries
  str = str.replace(/^"+|"+$/g, "").replace(/^\{+|\}+$/g, "").trim();

  const replaceBold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3. If already well-formed with structural HTML tags (h3/h2, p, ul)
  if (/<(?:h[1-6]|ul|ol|li)\b[^>]*>/i.test(str) && /<p\b[^>]*>/i.test(str)) {
    return replaceBold(str);
  }

  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parts: string[] = [];
  let inList = false;

  const isSectionEmoji = /^(?:[📌⚡🚀🛡️💡✨🔥🎯💎⚠️🔑📦🌟🏷️💰🔒⚙️❓👉])/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "\\n" || line === "\n") continue;

    // Markdown heading: ### Heading or ## Heading or # Heading
    if (/^#+\s+/.test(line)) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      const heading = line.replace(/^#+\s*/, "").trim();
      parts.push(`<h3>${replaceBold(heading)}</h3>`);
      continue;
    }

    // Emoji section heading, or bold heading on its own line, or short Bengali heading with colon
    const isEmojiHead = isSectionEmoji.test(line) && line.length < 90 && !line.endsWith("।");
    const isBoldHead = /^(\*\*[^*]+?\*\*[:]?)$/.test(line);
    const isColonHead = /^([A-Za-z\u0980-\u09FF\s]{3,40}[:：])$/.test(line);

    if (isEmojiHead || isBoldHead || isColonHead) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      const cleanHead = line.replace(/^\*\*|\*\*$/g, "").trim();
      parts.push(`<h3>${replaceBold(cleanHead)}</h3>`);
      continue;
    }

    // Bullet items: - item, * item, • item, – item, — item, ✅ item, ✓ item, 1. item
    if (/^[-*•–—✅✓✔]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      const itemText = line.replace(/^[-*•–—✅✓✔\d.)]+\s*/, "").trim();
      parts.push(`  <li>${replaceBold(itemText)}</li>`);
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

export interface ProviderComparisonInput {
  productName: string;
  priceBdt?: number;
  comparisons: Array<{
    providerId: string;
    providerName: string;
    dollarRate: number;
    upstreamProductId?: string | number;
    upstreamProductName?: string;
    costUsd: number;
    costBdt: number;
    stock: number;
    autoFulfill: boolean;
    isCheapest: boolean;
    isCurrent?: boolean;
  }>;
}

export interface ProviderComparisonAiResult {
  success: boolean;
  cheapestProviderName: string;
  verdict: string;
  analysisHtml: string;
  recommendation: string;
  modelUsed: string;
}

/**
 * Compare pricing, margins, and stock across multiple upstream providers using AI analysis
 */
export async function compareProvidersWithAi(
  input: ProviderComparisonInput
): Promise<ProviderComparisonAiResult> {
  const { productName, priceBdt, comparisons } = input;
  if (!comparisons || comparisons.length === 0) {
    return {
      success: false,
      cheapestProviderName: "",
      verdict: "No provider data available for comparison.",
      analysisHtml: "<p>No matching suppliers were found to compare.</p>",
      recommendation: "Please ensure suppliers are active in Settings.",
      modelUsed: "none",
    };
  }

  // Sort by BDT cost
  const sorted = [...comparisons].sort((a, b) => a.costBdt - b.costBdt);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const diffBdt = Math.max(0, mostExpensive.costBdt - cheapest.costBdt);
  const diffUsd = Number((Math.max(0, mostExpensive.costUsd - cheapest.costUsd)).toFixed(2));

  // Default algorithmic fallback
  const fallbackVerdict = comparisons.length === 1
    ? `Only 1 supplier offers "${productName}" at $${cheapest.costUsd.toFixed(2)} (৳${cheapest.costBdt}).`
    : `🏆 ${cheapest.providerName} is the cheapest at $${cheapest.costUsd.toFixed(2)} (৳${cheapest.costBdt}), saving ৳${diffBdt} ($${diffUsd}) per unit compared to ${mostExpensive.providerName}.`;

  const fallbackRecommendation = comparisons.length === 1
    ? `Keep this product routed to ${cheapest.providerName} (${cheapest.stock} units in stock).`
    : cheapest.stock > 0
    ? `Route this product to ${cheapest.providerName} for optimal savings and active stock (${cheapest.stock} available).`
    : `Warning: ${cheapest.providerName} has lowest cost but is currently OUT OF STOCK. Check the next cheapest provider with active stock.`;

  let fallbackHtml = `<h3>🏆 Price Winner &amp; Comparison</h3>\n<p><strong>${cheapest.providerName}</strong> provides the lowest purchase rate at <strong>$${cheapest.costUsd.toFixed(2)} USD (৳${cheapest.costBdt} BDT)</strong>.</p>\n`;
  if (comparisons.length > 1) {
    fallbackHtml += `<h3>📊 Margin &amp; Cost Savings</h3>\n<ul>\n`;
    for (const c of sorted) {
      const marginBdt = priceBdt && priceBdt > c.costBdt ? priceBdt - c.costBdt : 0;
      const marginPct = priceBdt && priceBdt > 0 ? ((marginBdt / priceBdt) * 100).toFixed(1) : "0";
      fallbackHtml += `  <li><strong>${c.providerName}:</strong> Cost $${c.costUsd.toFixed(2)} (৳${c.costBdt}) | Stock: ${c.stock}${priceBdt ? ` | Profit: ৳${marginBdt} (${marginPct}%)` : ""}${c.isCheapest ? " <strong>[CHEAPEST]</strong>" : ""}</li>\n`;
    }
    fallbackHtml += `</ul>\n`;
    fallbackHtml += `<h3>💡 Strategic Procurement Recommendation</h3>\n<p>${fallbackRecommendation}</p>`;
  }

  // Attempt AI call via OpenRouter
  const config = await getOpenRouterConfig();
  const apiKey = config.apiKey.trim();
  const primaryModel = config.model || DEFAULT_MODEL;

  if (!apiKey) {
    return {
      success: true,
      cheapestProviderName: cheapest.providerName,
      verdict: fallbackVerdict,
      analysisHtml: fallbackHtml,
      recommendation: fallbackRecommendation,
      modelUsed: "algorithmic-fallback",
    };
  }

  const promptText = `You are a senior procurement analyst for an e-commerce digital subscription platform in Bangladesh.
Analyze these upstream supplier quotes for the product "${productName}" and determine which provider is the most profitable, cost-effective, and safe to use.

Storefront Selling Price: ${priceBdt ? `৳${priceBdt} BDT (~$${(priceBdt / (cheapest.dollarRate || 127)).toFixed(2)} USD)` : "Not set"}

Supplier Quotes:
${comparisons
  .map(
    (c, i) =>
      `${i + 1}. Supplier: "${c.providerName}"
   - Upstream Item: ${c.upstreamProductName || productName}
   - Cost USD: $${c.costUsd.toFixed(2)}
   - Dollar Rate: ৳${c.dollarRate} per USD
   - Total Cost BDT: ৳${c.costBdt}
   - Stock: ${c.stock} units
   - Auto Fulfillment: ${c.autoFulfill ? "Enabled" : "Manual"}`
  )
  .join("\n\n")}

CRITICAL INSTRUCTIONS:
1. Identify which supplier is cheapest mathematically in BDT and USD.
2. Calculate the exact savings per order if choosing the cheapest provider over the alternatives.
3. Assess stock risk: If the cheapest supplier has 0 stock, explicitly warn the admin and recommend the best in-stock alternative.
4. If selling price is provided, calculate the profit margin in BDT and %.
5. Respond with ONLY a valid JSON object matching this schema:
{
  "cheapestProviderName": "Name of the winning provider",
  "verdict": "A 1-2 sentence punchy executive summary with emojis (e.g. 🏆 Canboso VIP is cheapest at $2.20 (৳279), saving you $0.60 per order...)",
  "recommendation": "A concise actionable instruction for the store owner",
  "analysisHtml": "Semantic HTML with <h3>, <p>, <ul>, <li>, and <strong> tags covering Cost Winner, Profit Margins, Stock Reliability, and Action Advice."
}`;

  const candidateModels = [primaryModel];
  if (primaryModel.endsWith(":free")) {
    for (const fb of FREE_FALLBACK_MODELS) {
      if (!candidateModels.includes(fb)) candidateModels.push(fb);
    }
  }

  for (const model of candidateModels) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://kalobazar.shop",
          "X-Title": "Kalobazar Provider Comparison",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: promptText }],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      });

      const rawData = await response.json();
      if (response.ok && !rawData.error && rawData.choices?.[0]?.message?.content) {
        const rawContent = rawData.choices[0].message.content.trim();
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let parsed: any = null;
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (_) {
            try {
              parsed = JSON.parse(sanitizeJsonControlChars(jsonMatch[0]));
            } catch (__) {}
          }
          if (parsed) {
            return {
              success: true,
              cheapestProviderName: parsed.cheapestProviderName || cheapest.providerName,
              verdict: parsed.verdict || fallbackVerdict,
              analysisHtml: ensureFormattedHtml(parsed.analysisHtml || fallbackHtml),
              recommendation: parsed.recommendation || fallbackRecommendation,
              modelUsed: model,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn(`[OpenRouter Provider Compare] Model "${model}" failed:`, err.message);
    }
  }

  // If all models failed, return solid algorithmic calculation
  return {
    success: true,
    cheapestProviderName: cheapest.providerName,
    verdict: fallbackVerdict,
    analysisHtml: fallbackHtml,
    recommendation: fallbackRecommendation,
    modelUsed: "algorithmic-fallback",
  };
}
