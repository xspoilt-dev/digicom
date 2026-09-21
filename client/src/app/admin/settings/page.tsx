"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import {
  Settings,
  Activity,
  Send,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Mail,
  Smartphone,
  Building,
  CreditCard,
  Eye,
  EyeOff,
  Wallet,
  DollarSign,
  Server,
  Zap,
  Sparkles,
  Bot,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";

interface CapiLogEntry {
  _id: string;
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  status: "success" | "failed" | "skipped";
  httpStatusCode?: number;
  responseBody?: any;
  errorMessage?: string;
  userDataMasked?: {
    emailMasked?: string;
    phoneMasked?: string;
    clientIp?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: Record<string, any>;
  testEventCode?: string;
  executionTimeMs?: number;
  createdAt: string;
}

type SettingsTab = "ai" | "canboso" | "store" | "payments" | "email" | "meta" | "logs";

export default function SettingsPage() {
  const { showAlert, showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [settings, setSettings] = useState<any>({
    company_info: { name: "", address: "", email: "", whatsapp: "", bkashNumber: "" },
    meta_pixel: { pixelId: "", accessToken: "", testEventCode: "" },
    email_settings: { resendApiKey: "", fromEmail: "" },
    zinipay_settings: { apiKey: "" },
    canboso_settings: { apiKey: "", dollarRate: 127, autoFulfill: true },
    openrouter_settings: {
      apiKey: "",
      model: "google/gemma-4-26b-a4b-it:free",
      customInstructions: "",
      autoGenerateOnImport: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  // OpenRouter AI Test State
  const [testingAi, setTestingAi] = useState(false);
  const [testAiResult, setTestAiResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    response?: string;
  } | null>(null);

  // Canboso Live Balance State
  const [canbosoBalance, setCanbosoBalance] = useState<{ balanceUsd: number; balanceVnd: number } | null>(null);
  const [checkingCanbosoBalance, setCheckingCanbosoBalance] = useState(false);
  const [canbosoBalanceError, setCanbosoBalanceError] = useState("");

  // CAPI Test State
  const [testingCapi, setTestingCapi] = useState(false);
  const [testCapiResult, setTestCapiResult] = useState<any>(null);

  // CAPI Logs State
  const [capiLogs, setCapiLogs] = useState<CapiLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CapiLogEntry | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Sync tab with URL hash on mount & hash change
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SettingsTab;
    if (["ai", "canboso", "store", "payments", "email", "meta", "logs"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/settings`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSettings({
          company_info: data.settings.company_info || { name: "", address: "", email: "", whatsapp: "", bkashNumber: "" },
          meta_pixel: data.settings.meta_pixel || { pixelId: "", accessToken: "", testEventCode: "" },
          email_settings: data.settings.email_settings || { resendApiKey: "", fromEmail: "" },
          zinipay_settings: data.settings.zinipay_settings || { apiKey: "" },
          canboso_settings: data.settings.canboso_settings || { apiKey: "", dollarRate: 127, autoFulfill: true },
          openrouter_settings: data.settings.openrouter_settings || {
            apiKey: "",
            model: "google/gemma-4-26b-a4b-it:free",
            customInstructions: "",
            autoGenerateOnImport: true,
          },
        });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCanbosoBalance = async () => {
    setCheckingCanbosoBalance(true);
    setCanbosoBalanceError("");
    try {
      const res = await fetch(`${apiUrl}/api/admin/canboso/balance`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setCanbosoBalance({ balanceUsd: data.balanceUsd, balanceVnd: data.balanceVnd });
      } else {
        setCanbosoBalanceError(data.message || "Failed to retrieve balance from Canboso API.");
      }
    } catch (err: any) {
      setCanbosoBalanceError(err.message || "Network error querying Canboso API.");
    } finally {
      setCheckingCanbosoBalance(false);
    }
  };

  const handleTestAi = async () => {
    if (!settings.openrouter_settings?.apiKey) {
      await showAlert({
        title: "API Key Required",
        message: "Please enter your OpenRouter API Key before testing.",
        type: "warning",
      });
      return;
    }

    setTestingAi(true);
    setTestAiResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/ai/test`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          apiKey: settings.openrouter_settings?.apiKey,
          model: settings.openrouter_settings?.model || "google/gemma-4-26b-a4b-it:free",
        }),
      });
      const data = await res.json();
      setTestAiResult(data);
    } catch (err: any) {
      setTestAiResult({
        success: false,
        message: err.message || "Network error querying OpenRouter API.",
      });
    } finally {
      setTestingAi(false);
    }
  };

  const fetchCapiLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/capi/logs?limit=25`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setCapiLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching CAPI logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCapiLogs();
  }, [apiUrl]);

  const handleSettingsSubmit = async (key: string, value: any) => {
    setSavingKey(key);
    try {
      const res = await fetch(`${apiUrl}/api/admin/settings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Settings Saved",
          message: "Settings updated and active across the store.",
          type: "success",
        });
        fetchSettings();
      } else {
        await showAlert({
          title: "Error",
          message: data.message || "Failed to update settings.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Network error updating settings.",
        type: "error",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestCapi = async () => {
    setTestingCapi(true);
    setTestCapiResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/capi/test`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          eventName: "TestEvent",
          testEventCode: settings.meta_pixel.testEventCode || undefined,
        }),
      });
      const data = await res.json();
      setTestCapiResult(data);
      fetchCapiLogs();
    } catch (err: any) {
      setTestCapiResult({ success: false, message: err.message });
    } finally {
      setTestingCapi(false);
    }
  };

  const handleClearCapiLogs = async () => {
    const confirmed = await showConfirm({
      title: "Clear Meta CAPI Logs",
      message: "Are you sure you want to clear all Meta CAPI logs? This action cannot be undone.",
      type: "warning",
      confirmText: "Clear Logs",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/capi/logs`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCapiLogs([]);
        setSelectedLog(null);
        await showAlert({
          title: "Logs Cleared",
          message: "All Meta CAPI logs have been cleared.",
          type: "success",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Error clearing logs.",
        type: "error",
      });
    }
  };

  const toggleTokenVisibility = (field: string) => {
    setShowTokens((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-amber-500"></span>
          <span className="text-xs font-bold text-stone-600">Loading system settings...</span>
        </div>
      </div>
    );
  }

  // Preset model options
  const PRESET_MODELS = [
    { id: "google/gemma-4-26b-a4b-it:free", name: "Google Gemma 4 (26B) - Free Tier", tag: "Free" },
    { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4 (31B) - Free Tier", tag: "Free" },
    { id: "nex-agi/nex-n2.5-pro:free", name: "Nex N2.5 Pro - Free & Active", tag: "Free" },
    { id: "z-ai/glm-5.2:free", name: "GLM 5.2 - Free & Fast", tag: "Free" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Chat) - Best Quality & Ultra Low Cost (~$0.001)", tag: "Paid / Top" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta Llama 3.3 (70B) - High Quality", tag: "Paid" },
    { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini - Ultra Fast & Cheap", tag: "Paid" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet - Flagship Copywriting", tag: "Paid" },
  ];

  const tabsConfig = [
    {
      id: "ai" as SettingsTab,
      label: "OpenRouter AI",
      icon: Sparkles,
      badge: settings.openrouter_settings?.apiKey ? "Active" : "Setup",
      badgeColor: settings.openrouter_settings?.apiKey ? "bg-amber-100 text-amber-950 font-bold" : "bg-stone-100 text-stone-600",
    },
    {
      id: "canboso" as SettingsTab,
      label: "Canboso Automation",
      icon: Server,
      badge: settings.canboso_settings?.apiKey ? "Connected" : "Setup",
      badgeColor: settings.canboso_settings?.apiKey ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-stone-100 text-stone-600",
    },
    {
      id: "store" as SettingsTab,
      label: "Store & Brand",
      icon: Building,
    },
    {
      id: "payments" as SettingsTab,
      label: "Payments & bKash",
      icon: CreditCard,
    },
    {
      id: "email" as SettingsTab,
      label: "Email Gateway",
      icon: Mail,
      badge: settings.email_settings?.resendApiKey ? "Active" : undefined,
      badgeColor: "bg-blue-100 text-blue-900 font-bold",
    },
    {
      id: "meta" as SettingsTab,
      label: "Meta Pixel & CAPI",
      icon: ShieldCheck,
      badge: settings.meta_pixel?.pixelId ? "Active" : undefined,
      badgeColor: "bg-purple-100 text-purple-900 font-bold",
    },
    {
      id: "logs" as SettingsTab,
      label: "CAPI Logs",
      icon: Activity,
      count: capiLogs.length,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-500" /> Settings &amp; Integrations
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            Configure OpenRouter AI, Canboso automation, store profile, payment gateways, and analytics
          </p>
        </div>

        {/* Quick Diagnostics Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`badge border-none text-xs font-bold py-2.5 px-3 flex items-center gap-1.5 ${
              settings.openrouter_settings?.apiKey ? "bg-amber-100 text-amber-950" : "bg-stone-100 text-stone-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI: {settings.openrouter_settings?.apiKey ? "Configured" : "No Token"}</span>
          </span>

          <span
            className={`badge border-none text-xs font-bold py-2.5 px-3 flex items-center gap-1.5 ${
              settings.canboso_settings?.apiKey ? "bg-emerald-100 text-emerald-950" : "bg-stone-100 text-stone-600"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span>Canboso: {settings.canboso_settings?.apiKey ? "Ready" : "No Key"}</span>
          </span>
        </div>
      </div>

      {/* Modern Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? "bg-amber-400 text-stone-950 border-amber-400 shadow-xs"
                  : "bg-white text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-stone-950" : "text-stone-500"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab.badgeColor || ""}`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-800 font-mono font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OPENROUTER AI TAB */}
      {activeTab === "ai" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  OpenRouter AI Marketing Copywriter
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Write catchy Bengali titles and comprehensive marketing descriptions for Bangladeshi customers automatically
                </p>
              </div>
            </div>
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Bot className="w-3.5 h-3.5 text-amber-500" />
              <span>Browse OpenRouter Models</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          </div>

          <div className="space-y-6">
            {/* API Key Field */}
            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-bold text-stone-800">
                OpenRouter API Key (sk-or-v1-...) *
              </label>
              <div className="relative flex items-center w-full">
                <input
                  type={showTokens["openrouter"] ? "text" : "password"}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full font-mono text-xs pr-10 block"
                  value={settings.openrouter_settings?.apiKey || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      openrouter_settings: {
                        ...settings.openrouter_settings,
                        apiKey: e.target.value.trim(),
                      },
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility("openrouter")}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500"
                >
                  {showTokens["openrouter"] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Get your API key at{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 underline font-bold"
                >
                  openrouter.ai/keys
                </a>
                . Free models like <span className="font-mono font-bold text-stone-700">google/gemma-4-26b-a4b-it:free</span> require zero cost!
              </p>
            </div>

            {/* Model Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">
                  Quick Model Preset
                </label>
                <select
                  className="select select-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl bg-stone-50/80 text-stone-900 text-xs font-semibold w-full block"
                  value={
                    PRESET_MODELS.some((m) => m.id === settings.openrouter_settings?.model)
                      ? settings.openrouter_settings?.model
                      : "custom"
                  }
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setSettings({
                        ...settings,
                        openrouter_settings: {
                          ...settings.openrouter_settings,
                          model: e.target.value,
                        },
                      });
                    }
                  }}
                >
                  {PRESET_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tag})
                    </option>
                  ))}
                  <option value="custom">Custom Model (Paste Any OpenRouter Model ID)</option>
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  Choose a recommended preset to auto-fill the identifier
                </p>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">
                  Model Identifier (Editable / Paste Any Model)
                </label>
                <input
                  type="text"
                  placeholder="e.g. google/gemma-4-26b-a4b-it:free"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-xs font-mono font-bold block"
                  value={settings.openrouter_settings?.model || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      openrouter_settings: {
                        ...settings.openrouter_settings,
                        model: e.target.value.trim(),
                      },
                    })
                  }
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  You can paste any model like <span className="font-mono font-bold text-stone-700">google/gemma-4-26b-a4b-it:free</span>
                </p>
              </div>
            </div>

            {/* Custom Instructions Textarea */}
            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-bold text-stone-800">
                Custom Copywriting Rules / Instructions (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="e.g. সর্বদাই ইনস্ট্যান্ট অটো ডেলিভারি, বিকাশ পেমেন্ট এবং ফুল মেয়াদ রিপ্লেসমেন্ট ওয়ারেন্টির কথা বিশেষভাবে উল্লেখ করবে।"
                className="textarea textarea-bordered focus:border-amber-400 rounded-xl bg-stone-50/80 text-stone-900 text-xs leading-relaxed w-full block"
                value={settings.openrouter_settings?.customInstructions || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    openrouter_settings: {
                      ...settings.openrouter_settings,
                      customInstructions: e.target.value,
                    },
                  })
                }
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Appended to the AI system prompt to enforce your store&apos;s specific marketing tone or warranty promises
              </p>
            </div>

            {/* Auto-generate Toggle */}
            <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  AI Copywriting Assistant in Canboso Import Modal
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Enables 1-click &apos;✨ AI দিয়ে বাংলায় লিখুন&apos; button when importing products from Canboso stock
                </span>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-warning toggle-sm shrink-0"
                checked={settings.openrouter_settings?.autoGenerateOnImport !== false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    openrouter_settings: {
                      ...settings.openrouter_settings,
                      autoGenerateOnImport: e.target.checked,
                    },
                  })
                }
              />
            </div>

            {/* Test Result Banner */}
            {testAiResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold space-y-1.5 ${
                  testAiResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testAiResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testAiResult.message}</span>
                </div>
                {testAiResult.response && (
                  <div className="font-mono text-[11px] text-stone-700 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                    Model Response: &quot;{testAiResult.response}&quot; (Model: {testAiResult.model})
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSettingsSubmit("openrouter_settings", settings.openrouter_settings)}
                disabled={savingKey === "openrouter_settings"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex-1 cursor-pointer"
              >
                {savingKey === "openrouter_settings" ? "Saving..." : "Save OpenRouter AI Settings"}
              </button>
              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi || !settings.openrouter_settings?.apiKey}
                className="btn bg-stone-900 hover:bg-stone-800 text-white border-none rounded-xl font-bold flex items-center gap-2 px-6 cursor-pointer"
              >
                {testingAi ? (
                  <span className="loading loading-spinner loading-xs text-amber-400"></span>
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>{testingAi ? "Testing OpenRouter..." : "Test AI Connection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CANBOSO AUTOMATION TAB */}
      {activeTab === "canboso" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  Canboso Buyer API &amp; Upstream Automation
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated stock import, real-time fulfillment purchase, and currency conversion rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/canboso"
                className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <span>Browse Upstream Stock</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </Link>
            </div>
          </div>

          {/* Upstream Balance Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-stone-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                  Canboso Upstream Wallet Balance
                </span>
                {canbosoBalance ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black text-stone-950 font-mono">
                      ${Number(canbosoBalance.balanceUsd || 0).toFixed(2)} USD
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      ({Number(canbosoBalance.balanceVnd || 0).toLocaleString()} VND)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-stone-500">
                    Click &apos;Check Live Balance&apos; to query your spendable balance
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckCanbosoBalance}
              disabled={checkingCanbosoBalance || !settings.canboso_settings.apiKey}
              className="btn bg-stone-950 hover:bg-stone-800 text-white btn-sm rounded-xl font-bold text-xs flex items-center gap-2 px-4 shrink-0 shadow-xs cursor-pointer"
            >
              <Wallet className={`w-3.5 h-3.5 ${checkingCanbosoBalance ? "animate-spin" : "text-amber-400"}`} />
              <span>{checkingCanbosoBalance ? "Checking..." : "Check Live Balance"}</span>
            </button>
          </div>

          {canbosoBalanceError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{canbosoBalanceError}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Bearer Token */}
            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-bold text-stone-800">
                Canboso Buyer API Bearer Token *
              </label>
              <div className="relative flex items-center w-full">
                <input
                  type={showTokens["canboso"] ? "text" : "password"}
                  placeholder="e.g. 19|GzN5x7g84K3xV69NmsGf9oI17i8oO..."
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full font-mono text-xs pr-10 block"
                  value={settings.canboso_settings.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      canboso_settings: { ...settings.canboso_settings, apiKey: e.target.value.trim() },
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility("canboso")}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500"
                >
                  {showTokens["canboso"] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                From Canboso Developer Dashboard. Endpoint: https://canboso.com/api/v2/telegram-buyer
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dollar Exchange Rate */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">
                  Dollar Exchange Rate (BDT per 1 USD) *
                </label>
                <div className="relative flex items-center w-full">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="127"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-bold pl-10 block"
                    value={settings.canboso_settings.dollarRate || 127}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        canboso_settings: {
                          ...settings.canboso_settings,
                          dollarRate: parseFloat(e.target.value) || 127,
                        },
                      })
                    }
                  />
                  <DollarSign className="w-4 h-4 text-stone-400 absolute left-3.5" />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Default: 127 BDT per 1 USD. Used for margin calculations and product import pricing.
                </p>
              </div>

              {/* Instant Automation Fulfillment Toggle */}
              <div className="space-y-1.5 w-full flex flex-col justify-end">
                <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Instant Automated Fulfillment
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Auto-purchases from Canboso &amp; sends credentials upon order payment
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm shrink-0"
                    checked={settings.canboso_settings.autoFulfill !== false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        canboso_settings: {
                          ...settings.canboso_settings,
                          autoFulfill: e.target.checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSettingsSubmit("canboso_settings", settings.canboso_settings)}
                disabled={savingKey === "canboso_settings"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full cursor-pointer"
              >
                {savingKey === "canboso_settings" ? "Saving..." : "Save Canboso API Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. STORE & BRAND TAB */}
      {activeTab === "store" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Brand Identity &amp; Support Profile</h2>
              <p className="text-xs text-stone-500 mt-0.5">Public store name and customer support contact channels</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-bold text-stone-800">Store / Brand Name *</label>
              <input
                type="text"
                placeholder="Kalobazar.shop"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-semibold block"
                value={settings.company_info.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_info: { ...settings.company_info, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Support Contact Email</label>
                <div className="relative flex items-center w-full">
                  <input
                    type="email"
                    placeholder="support@kalobazar.shop"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm pl-10 block"
                    value={settings.company_info.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_info: { ...settings.company_info, email: e.target.value },
                      })
                    }
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">WhatsApp Helpline Number</label>
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    placeholder="+88017xxxxxxxx"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm pl-10 font-mono block"
                    value={settings.company_info.whatsapp || settings.company_info.whatsappNumber || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_info: {
                          ...settings.company_info,
                          whatsapp: e.target.value,
                          whatsappNumber: e.target.value,
                        },
                      })
                    }
                  />
                  <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5" />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Linked in store footer, checkout helpdesk, and receipt pages
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSettingsSubmit("company_info", settings.company_info)}
                disabled={savingKey === "company_info"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full cursor-pointer"
              >
                {savingKey === "company_info" ? "Saving..." : "Save Store Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PAYMENTS TAB */}
      {activeTab === "payments" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Payment Gateways &amp; bKash Setup</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure manual mobile banking numbers (bKash/Nagad) and automated hosted payment gateway
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1: bKash / Nagad Manual Wallet */}
            <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-stone-900">1. Manual Mobile Banking (bKash / Nagad)</h3>
                  <p className="text-xs text-stone-500">Shown to customers on the checkout page for Send Money / Payment</p>
                </div>
                <span className="badge bg-amber-100 text-amber-900 font-bold border-none text-[10px]">
                  Manual Verification
                </span>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">bKash / Nagad Wallet Number</label>
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    placeholder="e.g. 017xxxxxxxx"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-white w-full text-sm pl-10 font-mono font-bold block"
                    value={settings.company_info.bkashNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company_info: { ...settings.company_info, bkashNumber: e.target.value },
                      })
                    }
                  />
                  <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5" />
                </div>
              </div>

              <button
                onClick={() => handleSettingsSubmit("company_info", settings.company_info)}
                disabled={savingKey === "company_info"}
                className="btn bg-stone-900 hover:bg-stone-800 text-white border-none rounded-xl font-bold btn-sm cursor-pointer"
              >
                {savingKey === "company_info" ? "Saving..." : "Save bKash Number"}
              </button>
            </div>

            {/* Section 2: Automated Hosted Gateway */}
            <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-stone-900">2. Automated Hosted Payment Gateway (Zinipay)</h3>
                  <p className="text-xs text-stone-500">Instant automatic payment verification and order status confirmation</p>
                </div>
                <span className="badge bg-emerald-100 text-emerald-900 font-bold border-none text-[10px]">
                  Instant Automation
                </span>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Gateway API Key</label>
                <div className="relative flex items-center w-full">
                  <input
                    type={showTokens["gateway"] ? "text" : "password"}
                    placeholder="sandbox_test_... or live_prod_..."
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-white w-full font-mono text-xs pr-10 block"
                    value={settings.zinipay_settings.apiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        zinipay_settings: { ...settings.zinipay_settings, apiKey: e.target.value.trim() },
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleTokenVisibility("gateway")}
                    className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500"
                  >
                    {showTokens["gateway"] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleSettingsSubmit("zinipay_settings", settings.zinipay_settings)}
                disabled={savingKey === "zinipay_settings"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold btn-sm shadow-sm cursor-pointer"
              >
                {savingKey === "zinipay_settings" ? "Saving..." : "Save Gateway Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EMAIL GATEWAY TAB */}
      {activeTab === "email" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Resend Email Gateway Configuration</h2>
              <p className="text-xs text-stone-500 mt-0.5">Automated delivery receipts and digital credentials dispatching</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Resend API Key *</label>
                <div className="relative flex items-center w-full">
                  <input
                    type={showTokens["resend"] ? "text" : "password"}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxx"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-xs font-mono pr-10 block"
                    value={settings.email_settings.resendApiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email_settings: { ...settings.email_settings, resendApiKey: e.target.value.trim() },
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleTokenVisibility("resend")}
                    className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500"
                  >
                    {showTokens["resend"] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  From your <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline font-bold">Resend Dashboard</a>
                </p>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">
                  From Domain Email (Authorized in Resend) *
                </label>
                <input
                  type="text"
                  placeholder="Kalobazar.shop <noreply@kalobazar.shop>"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm block"
                  value={settings.email_settings.fromEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_settings: { ...settings.email_settings, fromEmail: e.target.value.trim() },
                    })
                  }
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Must use your verified domain on Resend (e.g. kalobazar.shop)
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSettingsSubmit("email_settings", settings.email_settings)}
                disabled={savingKey === "email_settings"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full cursor-pointer"
              >
                {savingKey === "email_settings" ? "Saving..." : "Save Email Gateway Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. META PIXEL & CAPI TAB */}
      {activeTab === "meta" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Meta Pixel &amp; Conversions API (CAPI)</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Dual-dispatch server-side tracking with shared eventId deduplication and SHA-256 customer data hashing
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Meta Pixel ID</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-mono font-bold block"
                  value={settings.meta_pixel.pixelId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meta_pixel: { ...settings.meta_pixel, pixelId: e.target.value.trim() },
                    })
                  }
                />
              </div>

              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Meta Test Event Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TEST12345 (Leave blank in production)"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-mono block"
                  value={settings.meta_pixel.testEventCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meta_pixel: { ...settings.meta_pixel, testEventCode: e.target.value.trim() },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5 w-full">
              <label className="block text-xs font-bold text-stone-800">
                Meta Conversions API Access Token (EAAG...)
              </label>
              <div className="relative flex items-center w-full">
                <input
                  type={showTokens["capi"] ? "text" : "password"}
                  placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxx..."
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-xs pr-10 font-mono block"
                  value={settings.meta_pixel.accessToken}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meta_pixel: { ...settings.meta_pixel, accessToken: e.target.value.trim() },
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleTokenVisibility("capi")}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500"
                >
                  {showTokens["capi"] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Test Event Result Banner */}
            {testCapiResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold space-y-1.5 ${
                  testCapiResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testCapiResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{testCapiResult.message}</span>
                </div>
                {testCapiResult.eventId && (
                  <div className="font-mono text-[11px] text-stone-600">
                    Event ID: {testCapiResult.eventId}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => handleSettingsSubmit("meta_pixel", settings.meta_pixel)}
                disabled={savingKey === "meta_pixel"}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex-1 cursor-pointer"
              >
                {savingKey === "meta_pixel" ? "Saving..." : "Save Pixel Settings"}
              </button>
              <button
                onClick={handleTestCapi}
                disabled={testingCapi || !settings.meta_pixel.pixelId || !settings.meta_pixel.accessToken}
                className="btn bg-stone-900 hover:bg-stone-800 text-white border-none rounded-xl font-bold flex items-center gap-2 px-6 cursor-pointer"
              >
                {testingCapi ? (
                  <span className="loading loading-spinner loading-xs text-amber-400"></span>
                ) : (
                  <Send className="w-4 h-4 text-amber-400" />
                )}
                <span>Send Test Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CAPI LOGS TAB */}
      {activeTab === "logs" && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900">Meta CAPI Live Delivery Logs</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time event tracking dispatched to Meta Graph API v21.0
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCapiLogs}
                disabled={loadingLogs}
                className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleClearCapiLogs}
                className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                  <th>Status</th>
                  <th>Event Name</th>
                  <th>Event ID</th>
                  <th>HTTP</th>
                  <th>Latency</th>
                  <th>Timestamp</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {capiLogs.length > 0 ? (
                  capiLogs.map((log) => (
                    <tr key={log._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td>
                        {log.status === "success" ? (
                          <span className="badge badge-success badge-sm font-bold text-white">
                            Success
                          </span>
                        ) : log.status === "failed" ? (
                          <span className="badge badge-error badge-sm font-bold text-white">
                            Failed
                          </span>
                        ) : (
                          <span className="badge badge-warning badge-sm font-bold text-stone-900">
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="font-extrabold text-stone-900">{log.eventName}</td>
                      <td className="font-mono text-[11px] text-stone-600">{log.eventId}</td>
                      <td>
                        {log.httpStatusCode ? (
                          <span
                            className={`font-mono font-bold ${
                              log.httpStatusCode === 200 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {log.httpStatusCode}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="font-mono text-stone-600">
                        {log.executionTimeMs ? `${log.executionTimeMs}ms` : "-"}
                      </td>
                      <td className="text-stone-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-xs bg-amber-100 hover:bg-amber-200 text-stone-950 font-bold rounded-lg border-none cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-stone-400 font-medium">
                      {loadingLogs ? "Loading CAPI logs..." : "No CAPI events logged yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Modal for CAPI Event Payload */}
      {selectedLog && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-2xl bg-white border border-stone-200 shadow-2xl p-6 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                CAPI Event: {selectedLog.eventName}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm btn-ghost btn-circle">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-stone-500 block font-semibold">Event ID</span>
                  <span className="font-mono font-bold">{selectedLog.eventId}</span>
                </div>
                <div>
                  <span className="text-stone-500 block font-semibold">Status / Code</span>
                  <span className="font-bold">
                    {selectedLog.status.toUpperCase()} ({selectedLog.httpStatusCode || "N/A"})
                  </span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                  Error: {selectedLog.errorMessage}
                </div>
              )}

              <div>
                <span className="font-bold text-stone-700 block mb-1">Response Body:</span>
                <pre className="bg-stone-900 text-stone-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm bg-stone-900 text-white rounded-xl px-5 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
