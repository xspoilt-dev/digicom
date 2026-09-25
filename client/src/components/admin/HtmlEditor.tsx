"use client";

import { useEffect, useRef, useState } from "react";
import FormattedDescription, { cleanAndFormatDescription } from "@/components/FormattedDescription";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Minus,
  RemoveFormatting,
  Sparkles,
  Code,
  Eye,
  Edit3,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  onGenerateAi?: () => void;
  generatingAi?: boolean;
}

const SECTION_PRESETS = [
  {
    label: "📌 পণ্য পরিচিতি (Overview)",
    heading: "📌 পণ্য পরিচিতি",
    starter: "পণ্যটির সংক্ষিপ্ত পরিচিতি ও এটি কীভাবে ব্যবহারকারীর কাজে লাগবে...",
  },
  {
    label: "⚡ মূল বৈশিষ্ট্যসমূহ (Key Features)",
    heading: "⚡ মূল বৈশিষ্ট্যসমূহ",
    starter: "<ul><li>ফিচার ১: বিস্তারিত বিবরণ</li><li>ফিচার ২: বিস্তারিত বিবরণ</li><li>ফিচার ৩: বিস্তারিত বিবরণ</li></ul>",
  },
  {
    label: "🚀 ইনস্ট্যান্ট ডেলিভারি প্রক্রিয়া (Delivery)",
    heading: "🚀 ইনস্ট্যান্ট ডেলিভারি প্রক্রিয়া",
    starter: "bKash বা Nagad পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই স্বয়ংক্রিয়ভাবে ডেলিভারি ও এক্সেস শুরু হয়।",
  },
  {
    label: "🛡️ অফিসিয়াল ওয়ারেন্টি ও সাপোর্ট (Warranty)",
    heading: "🛡️ অফিসিয়াল ওয়ারেন্টি ও হেল্পলাইন",
    starter: "সম্পূর্ণ মেয়াদকালীন অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি এবং WhatsApp হেল্পলাইন সাপোর্ট রয়েছে।",
  },
  {
    label: "💡 কেন Kalobazar.shop থেকে নিবেন? (Why Us)",
    heading: "💡 কেন Kalobazar.shop থেকে নিবেন?",
    starter: "<ul><li>১০০% ভেরিফাইড ও নিরাপদ সার্ভিস</li><li>বাংলাদেশে সবচেয়ে সাশ্রয়ী মূল্য ও দ্রুত সাপোর্ট</li></ul>",
  },
  {
    label: "⚠️ ব্যবহারের নিয়মাবলী (Rules & Notice)",
    heading: "⚠️ ব্যবহারের নিয়মাবলী",
    starter: "অ্যাকাউন্টের কোনো পাসওয়ার্ড বা সেটিংস পরিবর্তন করা যাবে না। নিয়ম ভঙ্গ করলে ওয়ারেন্টি বাতিল হতে পারে।",
  },
];

export default function HtmlEditor({
  value,
  onChange,
  label = "Product Description (বিবরণ)",
  placeholder = "পণ্য পরিচিতি, সুবিধা ও ডেলিভারি বিবরণ লিখুন...",
  minHeight = "320px",
  onGenerateAi,
  generatingAi = false,
}: HtmlEditorProps) {
  const [tab, setTab] = useState<"visual" | "code" | "preview">("visual");
  const [cleanFeedback, setCleanFeedback] = useState<string>("");
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef<boolean>(false);

  // Sync value into visual contentEditable div when switching to visual or when value changes externally
  useEffect(() => {
    if (tab === "visual" && visualRef.current) {
      if (visualRef.current.innerHTML !== (value || "")) {
        visualRef.current.innerHTML = value || "";
      }
    }
  }, [tab, value]);

  // Execute standard formatting command on contentEditable
  const formatDoc = (command: string, arg: string | undefined = undefined) => {
    if (tab !== "visual" || !visualRef.current) return;
    visualRef.current.focus();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  const handleVisualInput = () => {
    if (!visualRef.current) return;
    const html = visualRef.current.innerHTML;
    isUpdatingRef.current = true;
    onChange(html);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  };

  const handleInsertHeading = (tag: "h3" | "h4" | "p") => {
    formatDoc("formatBlock", tag);
  };

  const handleInsertPreset = (preset: (typeof SECTION_PRESETS)[0]) => {
    if (tab !== "visual" || !visualRef.current) return;
    visualRef.current.focus();
    const presetHtml = `<h3>${preset.heading}</h3><p>${preset.starter}</p><p><br></p>`;
    document.execCommand("insertHTML", false, presetHtml);
    handleVisualInput();
  };

  const handleInsertLink = () => {
    if (tab !== "visual") return;
    const url = prompt("Enter URL link (e.g. https://example.com):");
    if (url) {
      formatDoc("createLink", url);
    }
  };

  const handleAutoClean = () => {
    const cleaned = cleanAndFormatDescription(value);
    onChange(cleaned);
    if (visualRef.current && tab === "visual") {
      visualRef.current.innerHTML = cleaned;
    }
    setCleanFeedback("✓ ফরম্যাট সফলভাবে ঠিক করা হয়েছে!");
    setTimeout(() => setCleanFeedback(""), 3000);
  };

  // Word and character counts
  const plainText = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  const charCount = plainText.length;

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-xs space-y-0 transition-all">
      {/* Editor Header Bar */}
      <div className="bg-stone-50/90 border-b border-stone-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-stone-800 tracking-tight flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-amber-500" />
            <span>{label}</span>
          </label>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("visual")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "visual"
                  ? "bg-white text-stone-900 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ভিজ্যুয়াল (Visual)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("code")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "code"
                  ? "bg-white text-stone-900 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML কোড</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "preview"
                  ? "bg-white text-stone-900 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>লাইভ প্রিভিউ</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {cleanFeedback && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {cleanFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleAutoClean}
            className="btn btn-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Clean text, emoji headers, and normalize into beautiful HTML"
          >
            <span>✨ অটো ফরম্যাট (Clean)</span>
          </button>

          {onGenerateAi && (
            <button
              type="button"
              onClick={onGenerateAi}
              disabled={generatingAi}
              className="btn btn-xs bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-lg font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
            >
              {generatingAi ? (
                <>
                  <span className="loading loading-spinner loading-xs text-stone-950"></span>
                  <span>⚡ AI দ্রুত লিখছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  <span>✨ AI দিয়ে লিখুন</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visual Mode Formatting Toolbar */}
      {tab === "visual" && (
        <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs text-stone-700">
          {/* Headings */}
          <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => handleInsertHeading("h3")}
              className="btn btn-xs btn-ghost hover:bg-white px-2 rounded font-black text-stone-900"
              title="Heading 3 (Section Title)"
            >
              <Heading3 className="w-3.5 h-3.5" />
              <span>H3</span>
            </button>
            <button
              type="button"
              onClick={() => handleInsertHeading("h4")}
              className="btn btn-xs btn-ghost hover:bg-white px-2 rounded font-bold text-stone-800"
              title="Heading 4 (Subheading)"
            >
              <Heading4 className="w-3.5 h-3.5" />
              <span>H4</span>
            </button>
            <button
              type="button"
              onClick={() => handleInsertHeading("p")}
              className="btn btn-xs btn-ghost hover:bg-white px-2 rounded font-medium text-stone-600"
              title="Paragraph"
            >
              <span>P</span>
            </button>
          </div>

          {/* Quick Bengali Presets Dropdown */}
          <div className="dropdown border-r border-stone-200 pr-1.5 mr-1">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              title="Insert standard e-commerce sections"
            >
              <span>+ সেকশন টেমপ্লেট</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[100] menu p-2 shadow-xl bg-white rounded-2xl w-72 border border-stone-200 text-xs font-semibold mt-1"
            >
              <li className="menu-title text-[10px] text-stone-400 uppercase font-bold px-2 py-1">
                Insert Ready Sections
              </li>
              {SECTION_PRESETS.map((p, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleInsertPreset(p)}
                    className="flex items-center gap-2 hover:bg-amber-50 text-stone-800 rounded-xl py-2"
                  >
                    <span>{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Text Styling */}
          <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => formatDoc("bold")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded font-bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("italic")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded italic"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("underline")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded underline"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("strikeThrough")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded line-through"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => formatDoc("insertUnorderedList")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("insertOrderedList")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rich Media / Elements */}
          <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
            <button
              type="button"
              onClick={handleInsertLink}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded"
              title="Insert Link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("formatBlock", "blockquote")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded"
              title="Quote / Callout"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => formatDoc("insertHorizontalRule")}
              className="btn btn-xs btn-ghost hover:bg-white p-1 rounded"
              title="Horizontal Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean / Reset */}
          <button
            type="button"
            onClick={() => formatDoc("removeFormat")}
            className="btn btn-xs btn-ghost hover:bg-white p-1 rounded text-stone-500 hover:text-stone-800"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-4 bg-white">
        {tab === "visual" && (
          <div
            ref={visualRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            data-placeholder={placeholder}
            className="w-full text-stone-900 text-sm leading-relaxed focus:outline-none overflow-y-auto
              [&_h3]:text-base [&_h3]:font-black [&_h3]:text-stone-900 [&_h3]:pt-3 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-stone-200/80 [&_h3]:first:pt-0 [&_h3]:mb-2 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2
              [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-stone-800 [&_h4]:pt-2 [&_h4]:mb-1
              [&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-stone-700
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-2
              [&_li]:text-stone-700
              [&_strong]:font-bold [&_strong]:text-stone-950
              [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50/50 [&_blockquote]:p-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-3 [&_blockquote]:italic
              [&_a]:text-amber-600 [&_a]:underline"
            style={{ minHeight }}
          />
        )}

        {tab === "code" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={12}
            className="w-full bg-stone-900 text-amber-300 font-mono text-xs leading-relaxed p-4 rounded-xl border border-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{ minHeight }}
          />
        )}

        {tab === "preview" && (
          <div className="w-full overflow-y-auto rounded-xl" style={{ minHeight }}>
            {value ? (
              <FormattedDescription content={value} />
            ) : (
              <p className="text-xs text-stone-400 p-8 text-center italic">
                কোনো বিবরণ লেখা হয়নি। ভিজ্যুয়াল এডিটরে লিখুন অথবা "✨ AI দিয়ে লিখুন" বাটনে ক্লিক করুন।
              </p>
            )}
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 flex items-center justify-between text-[11px] text-stone-500 font-medium">
        <div className="flex items-center gap-3">
          <span>
            শব্দ (Words): <strong className="text-stone-800 font-bold">{wordCount}</strong>
          </span>
          <span>
            অক্ষর (Chars): <strong className="text-stone-800 font-bold">{charCount}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>টিপস: সেকশন হেডারের জন্য H3 এবং সুবিধার জন্য Bullet List ব্যবহার করুন</span>
        </div>
      </div>
    </div>
  );
}
