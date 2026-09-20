import React from "react";

// Clean brand icons for digital tools and services matching the user screenshot
export const BrandIcon = ({ name, className = "w-4 h-4" }: { name: string; className?: string }) => {
  const normalized = name.toLowerCase().trim();

  switch (normalized) {
    case "chatgpt":
    case "openai":
    case "api-gpt":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 9.5a5.5 5.5 0 0 0-.5-3.3 5.7 5.7 0 0 0-3.3-2.8 5.6 5.6 0 0 0-4.3.4A5.6 5.6 0 0 0 8 2.5a5.7 5.7 0 0 0-4.2 2.5 5.6 5.6 0 0 0-.7 4.2 5.6 5.6 0 0 0-2.2 4.3 5.7 5.7 0 0 0 1.6 4 5.6 5.6 0 0 0 3.8 2 5.6 5.6 0 0 0 4.4 1.3 5.7 5.7 0 0 0 4.2-2.5 5.6 5.6 0 0 0 .7-4.2 5.6 5.6 0 0 0 2.2-4.3 5.7 5.7 0 0 0-1.5-4.3zm-7.6 11.2a4.3 4.3 0 0 1-2.9-.1l.1-.6 2.3-3.9a.8.8 0 0 1 .7-.4h.1l3 1.7a4.3 4.3 0 0 1-3.3 3.3zm-6.6-2.5a4.3 4.3 0 0 1-1.6-2.4l.6-.3 4.4-1.2a.8.8 0 0 1 .8.3l1.5 2.6a4.3 4.3 0 0 1-5.7 1zm-1.8-6.9a4.3 4.3 0 0 1 1.4-2.6l.5.3 2.1 4.1a.8.8 0 0 1 0 .8l-1.5 2.6a4.3 4.3 0 0 1-2.5-5.2zm8.7-2.1l-2.4 1.4-2.4-1.4 2.4-1.4 2.4 1.4zm2.1-4.7a4.3 4.3 0 0 1 2.9.1l-.1.6-2.3 3.9a.8.8 0 0 1-.7.4h-.1l-3-1.7a4.3 4.3 0 0 1 3.3-3.3zm6.6 2.5a4.3 4.3 0 0 1 1.6 2.4l-.6.3-4.4 1.2a.8.8 0 0 1-.8-.3l-1.5-2.6a4.3 4.3 0 0 1 5.7-1zm1.8 6.9a4.3 4.3 0 0 1-1.4 2.6l-.5-.3-2.1-4.1a.8.8 0 0 1 0-.8l1.5-2.6a4.3 4.3 0 0 1 2.5 5.2z"/>
        </svg>
      );

    case "claude":
      return (
        <svg className={`${className} text-amber-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.9H21l-5.7 4.2 2.2 6.9-5.5-4.2-5.5 4.2 2.2-6.9L3 8.9h6.6L12 2z" />
        </svg>
      );

    case "gemini":
      return (
        <svg className={`${className} text-blue-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z"/>
        </svg>
      );

    case "capcut":
      return (
        <svg className={`${className} text-white`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6.5L12 11.5L20 6.5L12 1.5L4 6.5ZM4 17.5L12 22.5L20 17.5L12 12.5L4 17.5Z"/>
        </svg>
      );

    case "adobe":
      return (
        <svg className={`${className} text-red-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.96 4H23v16h-4.32l-3.32-8.58L13.96 4zM10.04 4H1v16h4.32l3.32-8.58L10.04 4zM12 9.87l2.84 7.37H9.16L12 9.87z"/>
        </svg>
      );

    case "grok":
    case "x":
      return (
        <svg className={`${className} text-white`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );

    case "cursor":
      return (
        <svg className={`${className} text-cyan-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      );

    case "lovable":
      return (
        <svg className={`${className} text-pink-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      );

    case "canva":
      return (
        <svg className={`${className} text-teal-400`} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 8.5c-.83 0-1.5.67-1.5 1.5v4c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5zm-6 0C8.17 8.5 7.5 9.17 7.5 10v4c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5z" fill="#000" />
        </svg>
      );

    case "spotify":
      return (
        <svg className={`${className} text-emerald-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.42c-.18.3-.55.4-.85.22-2.33-1.42-5.26-1.74-8.71-.95-.34.08-.68-.13-.76-.47-.08-.34.13-.68.47-.76 3.78-.86 7.03-.5 9.63 1.11.3.18.4.55.22.85zm1.22-2.72c-.23.37-.71.49-1.08.26-2.67-1.64-6.74-2.12-9.9-1.16-.42.13-.86-.11-.99-.53-.13-.42.11-.86.53-.99 3.61-1.1 8.11-.57 11.18 1.34.37.23.49.71.26 1.08zm.13-2.83C14.73 9 9.47 8.83 6.42 9.76c-.49.15-1.02-.13-1.17-.62-.15-.49.13-1.02.62-1.17 3.52-1.07 9.35-.87 13.04 1.32.44.26.59.83.33 1.27-.26.44-.83.59-1.27.33z"/>
        </svg>
      );

    case "netflix":
      return (
        <svg className={`${className} text-red-600`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.398 0v24c1.862-.27 3.73-.594 5.602-.958V0H5.398zm7.6 0v11.758l4.4 10.778c1.87-.37 3.73-.78 5.6-1.218V0h-5.6v8.438L12.998 0z"/>
        </svg>
      );

    case "nordvpn":
    case "express":
    case "proton":
    case "surfshark":
      return (
        <svg className={`${className} text-sky-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
        </svg>
      );

    case "youtube":
      return (
        <svg className={`${className} text-red-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );

    case "suno":
    case "eleven":
    case "minimax":
      return (
        <svg className={`${className} text-orange-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      );

    case "runway":
    case "kling":
    case "dreamina":
    case "openart":
    case "freepik":
      return (
        <svg className={`${className} text-purple-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );

    case "tele":
    case "telegram":
      return (
        <svg className={`${className} text-sky-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.38-.49 1.04-.75 4.09-1.78 6.82-2.95 8.19-3.52 3.9-1.63 4.71-1.91 5.24-1.92.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.04.29z"/>
        </svg>
      );

    case "gmail":
    case "outlook":
      return (
        <svg className={`${className} text-red-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      );

    default:
      return (
        <svg className={`${className} text-primary`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
};

// Full list of brand service pills matching the user's uploaded image
export const BRAND_SERVICES = [
  { id: "all", name: "সকল সার্ভিস", tag: "" },
  { id: "chatgpt", name: "ChatGPT", tag: "chatgpt" },
  { id: "claude", name: "Claude", tag: "claude" },
  { id: "gemini", name: "Gemini", tag: "gemini" },
  { id: "cursor", name: "Cursor", tag: "cursor" },
  { id: "canva", name: "Canva", tag: "canva" },
  { id: "adobe", name: "Adobe", tag: "adobe" },
  { id: "capcut", name: "Capcut", tag: "capcut" },
  { id: "grok", name: "Grok", tag: "grok" },
  { id: "spotify", name: "Spotify", tag: "spotify" },
  { id: "netflix", name: "NetFlix", tag: "netflix" },
  { id: "youtube", name: "Youtube", tag: "youtube" },
  { id: "nordvpn", name: "NordVPN", tag: "nordvpn" },
  { id: "express", name: "Express", tag: "express" },
  { id: "proton", name: "Proton", tag: "proton" },
  { id: "surfshark", name: "SurfShark", tag: "surfshark" },
  { id: "lovable", name: "Lovable", tag: "lovable" },
  { id: "runway", name: "Runway", tag: "runway" },
  { id: "kling", name: "Kling", tag: "kling" },
  { id: "suno", name: "Suno", tag: "suno" },
  { id: "eleven", name: "Eleven", tag: "eleven" },
  { id: "duolingo", name: "Duolingo", tag: "duolingo" },
  { id: "tele", name: "Tele", tag: "tele" },
  { id: "gmail", name: "Gmail", tag: "gmail" },
  { id: "outlook", name: "Outlook", tag: "outlook" },
  { id: "autodesk", name: "AutoDesk", tag: "autodesk" },
  { id: "railway", name: "Railway", tag: "railway" },
  { id: "n8n", name: "n8n", tag: "n8n" },
  { id: "perplexity", name: "Perple...", tag: "perplexity" },
  { id: "openart", name: "OpenArt", tag: "openart" },
  { id: "notion", name: "Notion", tag: "notion" },
  { id: "minimax", name: "Minimax", tag: "minimax" },
  { id: "veo3", name: "Veo3 U...", tag: "veo3" },
  { id: "freepik", name: "Freepik", tag: "freepik" },
  { id: "zoom", name: "zoom", tag: "zoom" },
  { id: "xbox", name: "Xbox", tag: "xbox" },
  { id: "scribd", name: "SCRIBD", tag: "scribd" },
  { id: "roblox", name: "Roblox", tag: "roblox" },
];
