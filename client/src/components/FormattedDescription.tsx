"use client";

import React from "react";

interface FormattedDescriptionProps {
  content?: string;
  className?: string;
}

export default function FormattedDescription({
  content,
  className = "",
}: FormattedDescriptionProps) {
  if (!content) return null;

  // Helper to parse inline bold **text**
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-stone-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Split lines
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 my-2.5 pl-1">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-stone-700 text-xs sm:text-sm leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading: ### Heading or ## Heading or # Heading
    if (trimmed.startsWith("#")) {
      flushList();
      const headingText = trimmed.replace(/^#+\s*/, "");
      elements.push(
        <div
          key={`h-${i}`}
          className="pt-4 first:pt-0 pb-1.5 border-b border-stone-200/70 mb-2"
        >
          <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
            {headingText}
          </h3>
        </div>
      );
      continue;
    }

    // Bullet point: - item, * item, • item, or ✅ item
    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("• ") ||
      trimmed.startsWith("✅ ")
    ) {
      const itemText = trimmed.replace(/^[-*•✅]\s*/, "");
      currentList.push(itemText);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="text-stone-700 text-xs sm:text-sm leading-relaxed my-2"
      >
        {parseInline(trimmed)}
      </p>
    );
  }

  flushList();

  return (
    <div
      className={`bg-stone-50/70 rounded-2xl border border-stone-200/80 p-4 sm:p-6 space-y-1 ${className}`}
    >
      {elements}
    </div>
  );
}

/**
 * Strips markdown syntax and returns a short, clean single-line preview snippet for cards & banners
 */
export function getCleanSnippet(description?: string, maxLength: number = 140): string {
  if (!description) return "";

  const clean = description
    .replace(/^#+\s*[^\n]*\n?/gm, "") // remove heading lines like ### 📌 পণ্য পরিচিতি
    .replace(/^[-*•✅]\s+/gm, "")     // remove bullet prefixes
    .replace(/\*\*(.*?)\*\*/g, "$1")  // remove bold asterisks
    .replace(/\n+/g, " ")             // replace newlines with space
    .replace(/\s{2,}/g, " ")          // collapse spaces
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "...";
}
