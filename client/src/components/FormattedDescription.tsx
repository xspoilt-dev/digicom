"use client";

import React from "react";

interface FormattedDescriptionProps {
  content?: string;
  className?: string;
}

/**
 * Robust utility to extract description from accidental JSON payloads,
 * unescape linebreaks, and format emoji headings, markdown, and bullets into clean semantic HTML.
 */
export function cleanAndFormatDescription(content?: string): string {
  if (!content || !content.trim()) return "";

  let str = content.trim();

  // 1. If content is accidentally a JSON string (e.g. from LLM dump), extract description
  if (str.startsWith("{") || /"description"\s*:/i.test(str)) {
    try {
      // sanitize unescaped control characters in JSON string
      const sanitized = str.replace(/[\u0000-\u001f](?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/g, " ");
      const parsed = JSON.parse(sanitized);
      if (parsed.description) {
        str = String(parsed.description);
      }
    } catch (_) {
      // Regex extraction fallback
      const descMatch =
        str.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\}|\s*\}\s*$|"$)/i) ||
        str.match(/"description"\s*:\s*"([\s\S]*)/i);
      if (descMatch) {
        str = descMatch[1].replace(/"?\s*\}?\s*$/, "").trim();
      }
    }
  }

  // 2. Normalize literal \n or \r
  str = str.replace(/\\n/g, "\n").replace(/\\r/g, "").trim();

  // 3. Remove leading/trailing stray quotes or JSON braces
  str = str.replace(/^"+|"+$/g, "").replace(/^\{+|\}+$/g, "").trim();

  const replaceBold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 4. If already full of proper semantic HTML tags (h2/h3/p/ul)
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

export default function FormattedDescription({
  content,
  className = "",
}: FormattedDescriptionProps) {
  if (!content) return null;

  const html = cleanAndFormatDescription(content);
  if (!html) return null;

  return (
    <div
      className={`bg-stone-50/70 rounded-2xl border border-stone-200/80 p-4 sm:p-6 text-xs sm:text-sm text-stone-700 leading-relaxed
        [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-black [&_h3]:text-stone-900 [&_h3]:pt-4 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-stone-200/80 [&_h3]:first:pt-0 [&_h3]:mb-2.5 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2
        [&_h4]:text-xs sm:[&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-stone-900 [&_h4]:pt-2 [&_h4]:mb-1.5
        [&_p]:my-2.5 [&_p]:leading-relaxed [&_p]:text-stone-700
        [&_ul]:space-y-2 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc
        [&_li]:marker:text-amber-500 [&_li]:text-stone-700 [&_li]:leading-relaxed
        [&_strong]:font-bold [&_strong]:text-stone-950
        ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Strips HTML tags, markdown syntax, and returns a short, clean single-line preview snippet for cards & banners
 */
export function getCleanSnippet(description?: string, maxLength: number = 140): string {
  if (!description) return "";

  // First extract clean description (in case description was raw JSON)
  const formatted = cleanAndFormatDescription(description);

  const clean = formatted
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ") // remove headings completely so preview starts with intro text
    .replace(/^#+\s*[^\n]*\n?/gm, "")                 // remove markdown heading lines
    .replace(/<[^>]*>/g, " ")                         // strip all other HTML tags
    .replace(/^[-*•–—✅✓✔]\s+/gm, "")                 // remove bullet prefixes
    .replace(/\*\*(.*?)\*\*/g, "$1")                  // remove bold asterisks
    .replace(/\s+/g, " ")                             // collapse all whitespace
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "...";
}
