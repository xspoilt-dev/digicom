"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
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
  Plus,
  Globe,
  Layers,
  Edit2,
  X,
  Star,
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

interface ProviderItem {
  _id: string;
  name: string;
  slug: string;
  type: string;
  apiKey: string;
  baseUrl: string;
  dollarRate: number;
  autoFulfill: boolean;
  isActive: boolean;
  isDefault: boolean;
  balanceUsd?: number;
  balanceVnd?: number;
  lastSyncAt?: string;
  notes?: string;
  productCount?: number;
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

  // ZiniPay Test State
  const [testingZinipay, setTestingZinipay] = useState(false);
  const [testZinipayResult, setTestZinipayResult] = useState<{
    success: boolean;
    message: string;
    isSandbox?: boolean;
  } | null>(null);

  // CAPI Test State
  const [testingCapi, setTestingCapi] = useState(false);
  const [testCapiResult, setTestCapiResult] = useState<any>(null);

  // CAPI Logs State
  const [capiLogs, setCapiLogs] = useState<CapiLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CapiLogEntry | null>(null);

  // Multi-Provider Management State
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [providerForm, setProviderForm] = useState({
    name: "",
    apiKey: "",
    baseUrl: "https://canboso.com",
    dollarRate: 127,
    autoFulfill: true,
    isActive: true,
    isDefault: false,
    notes: "",
  });
  const [testingProviderKey, setTestingProviderKey] = useState(false);
  const [testProviderResult, setTestProviderResult] = useState<{
    success: boolean;
    message: string;
    balanceUsd?: number;
    balanceVnd?: number;
  } | null>(null);
  const [checkingProviderId, setCheckingProviderId] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState(false);

  const apiUrl = getApiUrl();

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

  const handleTestZinipay = async () => {
    setTestingZinipay(true);
    setTestZinipayResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/zinipay/test`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          apiKey: settings.zinipay_settings.apiKey,
        }),
      });
      const data = await res.json();
      setTestZinipayResult(data);
    } catch (err: any) {
      setTestZinipayResult({
        success: false,
        message: err.message || "Failed to communicate with ZiniPay server.",
      });
    } finally {
      setTestingZinipay(false);
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

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/providers`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleOpenAddProvider = () => {
    setEditingProvider(null);
    setProviderForm({
      name: "",
      apiKey: "",
      baseUrl: "https://canboso.com",
      dollarRate: 127,
      autoFulfill: true,
      isActive: true,
      isDefault: providers.length === 0,
      notes: "",
    });
    setTestProviderResult(null);
    setIsProviderModalOpen(true);
  };

  const handleOpenEditProvider = (p: ProviderItem) => {
    setEditingProvider(p);
    setProviderForm({
      name: p.name,
      apiKey: p.apiKey,
      baseUrl: p.baseUrl || "https://canboso.com",
      dollarRate: p.dollarRate || 127,
      autoFulfill: p.autoFulfill !== false,
      isActive: p.isActive !== false,
      isDefault: Boolean(p.isDefault),
      notes: p.notes || "",
    });
    setTestProviderResult(null);
    setIsProviderModalOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name.trim() || !providerForm.apiKey.trim()) {
      await showAlert({
        title: "Validation Error",
        message: "Provider Name and API Key are required.",
        type: "warning",
      });
      return;
    }

    setSavingProvider(true);
    try {
      const endpoint = editingProvider
        ? `${apiUrl}/api/admin/providers/${editingProvider._id}`
        : `${apiUrl}/api/admin/providers`;
      const method = editingProvider ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(providerForm),
      });

      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Provider Saved",
          message: editingProvider ? "Provider updated successfully!" : "Provider added successfully!",
          type: "success",
        });
        setIsProviderModalOpen(false);
        fetchProviders();
      } else {
        await showAlert({
          title: "Error",
          message: data.message || "Failed to save provider.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Failed to communicate with server.",
        type: "error",
      });
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (p: ProviderItem) => {
    const confirmed = await showConfirm({
      title: "Delete Provider",
      message: `Are you sure you want to delete "${p.name}"? If products are connected to this provider, you must reassign them first.`,
      type: "warning",
      confirmText: "Delete Provider",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/providers/${p._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Provider Deleted",
          message: "Provider removed successfully.",
          type: "success",
        });
        fetchProviders();
      } else {
        await showAlert({
          title: "Delete Failed",
          message: data.message || "Cannot delete provider.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Network error.",
        type: "error",
      });
    }
  };

  const handleCheckProviderBalance = async (p: ProviderItem) => {
    setCheckingProviderId(p._id);
    try {
      const res = await fetch(`${apiUrl}/api/admin/providers/${p._id}/test`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: `${p.name} Balance`,
          message: `Live Balance: $${data.balanceUsd} USD (${data.balanceVnd?.toLocaleString()} ₫)`,
          type: "success",
        });
        fetchProviders();
      } else {
        await showAlert({
          title: "Balance Check Failed",
          message: data.message || "Failed to fetch balance from provider.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Network error checking balance.",
        type: "error",
      });
    } finally {
      setCheckingProviderId(null);
    }
  };

  const handleTestProviderKey = async () => {
    if (!providerForm.apiKey.trim()) {
      await showAlert({
        title: "API Key Required",
        message: "Please enter an API Key to test.",
        type: "warning",
      });
      return;
    }
    setTestingProviderKey(true);
    setTestProviderResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/providers/test-key`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          apiKey: providerForm.apiKey,
          baseUrl: providerForm.baseUrl,
        }),
      });
      const data = await res.json();
      setTestProviderResult(data);
    } catch (err: any) {
      setTestProviderResult({
        success: false,
        message: err.message || "Failed to test key with provider server.",
      });
    } finally {
      setTestingProviderKey(false);
    }
  };

  const handleSetDefaultProvider = async (p: ProviderItem) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/providers/${p._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProviders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCapiLogs();
    fetchProviders();
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
      label: "Upstream Providers",
      icon: Server,
      badge: providers.length > 0 ? `${providers.length} Connected` : "Setup",
      badgeColor: providers.length > 0 ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-stone-100 text-stone-600",
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
            Configure OpenRouter AI, Upstream Providers, store profile, payment gateways, and analytics
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
              providers.length > 0 ? "bg-emerald-100 text-emerald-950" : "bg-stone-100 text-stone-600"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span>Providers: {providers.length > 0 ? `${providers.length} Connected` : "No Providers"}</span>
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

      {/* 2. UPSTREAM PROVIDERS TAB */}
      {activeTab === "canboso" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
                    Upstream Suppliers &amp; Providers
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Register multiple API keys, configure custom exchange rates, and route product fulfillments.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/admin/canboso"
                  className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-stone-100"
                >
                  <Globe className="w-3.5 h-3.5 text-stone-500" />
                  <span>Browse Upstream Stock</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </Link>
                <button
                  type="button"
                  onClick={handleOpenAddProvider}
                  className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Provider</span>
                </button>
              </div>
            </div>

            {/* Providers List / Cards */}
            {loadingProviders ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-md text-amber-500"></span>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50">
                <Server className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800">No Providers Configured</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
                  Add your primary Canboso Buyer API key or secondary upstream suppliers to start importing stock and routing auto-fulfillments.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddProvider}
                  className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 btn-sm rounded-xl font-bold text-xs inline-flex items-center gap-1.5 border-none shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Provider</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {providers.map((p) => {
                  const isKeyVisible = showTokens[p._id];
                  const maskedKey = p.apiKey
                    ? isKeyVisible
                      ? p.apiKey
                      : `${p.apiKey.slice(0, 8)}••••••••••••••••${p.apiKey.slice(-4)}`
                    : "No Key";

                  return (
                    <div
                      key={p._id}
                      className={`rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 ${
                        p.isDefault
                          ? "bg-amber-50/40 border-amber-300 shadow-sm"
                          : "bg-stone-50/60 border-stone-200/90 hover:border-stone-300"
                      }`}
                    >
                      {/* Card Top: Name, Badges, Menu */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-stone-900">{p.name}</h3>
                              {p.isDefault && (
                                <span className="badge badge-warning badge-sm font-black text-[10px] uppercase gap-1">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Default
                                </span>
                              )}
                              <span
                                className={`badge badge-sm font-bold text-[10px] uppercase ${
                                  p.isActive
                                    ? "bg-emerald-100 text-emerald-800 border-none"
                                    : "bg-stone-200 text-stone-600 border-none"
                                }`}
                              >
                                {p.isActive ? "Active" : "Disabled"}
                              </span>
                              <span className="badge badge-ghost badge-sm text-[10px] font-semibold text-stone-500">
                                {p.type || "canboso"}
                              </span>
                            </div>
                            {p.notes && (
                              <p className="text-[11px] text-stone-500 mt-1 italic">{p.notes}</p>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!p.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultProvider(p)}
                                title="Set as default provider"
                                className="btn btn-ghost btn-xs text-stone-500 hover:text-amber-600 rounded-lg cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditProvider(p)}
                              title="Edit provider settings"
                              className="btn btn-ghost btn-xs text-stone-600 hover:text-stone-950 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProvider(p)}
                              title="Delete provider"
                              className="btn btn-ghost btn-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* API Key Box */}
                        <div className="mt-4 bg-white rounded-xl border border-stone-200/80 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
                              API Key:
                            </span>
                            <span className="font-mono text-xs text-stone-800 truncate">
                              {maskedKey}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleTokenVisibility(p._id)}
                              className="btn btn-ghost btn-xs p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                              title={isKeyVisible ? "Hide key" : "Show key"}
                            >
                              {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(p.apiKey);
                                setCopiedKey(p._id);
                                setTimeout(() => setCopiedKey(null), 2000);
                              }}
                              className="btn btn-ghost btn-xs p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                              title="Copy API key"
                            >
                              {copiedKey === p._id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/60">
                            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                              Exchange Rate
                            </span>
                            <span className="font-bold text-stone-900 mt-0.5 block">
                              1 USD = {p.dollarRate || 127} BDT
                            </span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/60">
                            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                              Auto-Fulfillment
                            </span>
                            <span className={`font-bold mt-0.5 block ${p.autoFulfill ? "text-emerald-700" : "text-stone-500"}`}>
                              {p.autoFulfill ? "Enabled (Auto)" : "Disabled"}
                            </span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/60">
                            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                              Connected Products
                            </span>
                            <Link
                              href={`/admin/products?providerId=${p._id}`}
                              className="font-bold text-amber-700 hover:underline mt-0.5 block"
                            >
                              {p.productCount || 0} Products Linked &rarr;
                            </Link>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/60">
                            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                              Endpoint Host
                            </span>
                            <span className="font-mono text-[11px] text-stone-700 mt-0.5 block truncate" title={p.baseUrl}>
                              {p.baseUrl || "canboso.com"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom: Upstream Balance & Refresh */}
                      <div className="pt-3 border-t border-stone-200/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-stone-400 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Live Balance
                            </span>
                            {p.balanceUsd !== undefined ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-stone-900 font-mono">
                                  ${Number(p.balanceUsd).toFixed(2)} USD
                                </span>
                                {p.balanceVnd !== undefined && (
                                  <span className="text-[10px] text-stone-500 font-medium">
                                    ({Number(p.balanceVnd).toLocaleString()} ₫)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400">Not queried yet</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCheckProviderBalance(p)}
                          disabled={checkingProviderId === p._id}
                          className="btn btn-xs bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold flex items-center gap-1.5 px-3 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${checkingProviderId === p._id ? "animate-spin text-amber-400" : ""}`} />
                          <span>{checkingProviderId === p._id ? "Checking..." : "Check"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADD / EDIT PROVIDER MODAL */}
          {isProviderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-stone-950">
                        {editingProvider ? `Edit Provider: ${editingProvider.name}` : "Add Upstream Provider"}
                      </h3>
                      <p className="text-xs text-stone-500">
                        Configure supplier credentials and fulfillment rules
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProviderModalOpen(false)}
                    className="btn btn-ghost btn-circle btn-sm text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Provider Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-800">
                      Provider Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Canboso VIP, Canboso Backup"
                      className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-bold"
                      value={providerForm.name}
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                    />
                    <p className="text-[11px] text-stone-500">
                      A human-friendly label displayed in product selectors and order fulfillment logs.
                    </p>
                  </div>

                  {/* API Bearer Token */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-800">
                      API Bearer Token *
                    </label>
                    <div className="relative flex items-center w-full">
                      <input
                        type={showTokens["form_api_key"] ? "text" : "password"}
                        placeholder="e.g. 19|GzN5x7g84K3xV69NmsGf9oI17i8oO..."
                        className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full font-mono text-xs pr-10"
                        value={providerForm.apiKey}
                        onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value.trim() })}
                      />
                      <button
                        type="button"
                        onClick={() => toggleTokenVisibility("form_api_key")}
                        className="btn btn-ghost btn-xs btn-circle absolute right-2 text-stone-500 cursor-pointer"
                      >
                        {showTokens["form_api_key"] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Base URL & Exchange Rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-800">
                        Base URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://canboso.com"
                        className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full font-mono text-xs"
                        value={providerForm.baseUrl}
                        onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value.trim() })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-800">
                        Dollar Rate (BDT / 1 USD) *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          placeholder="127"
                          className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-sm font-bold pl-9"
                          value={providerForm.dollarRate}
                          onChange={(e) => setProviderForm({ ...providerForm, dollarRate: parseFloat(e.target.value) || 127 })}
                        />
                        <DollarSign className="w-4 h-4 text-stone-400 absolute left-3" />
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-warning toggle-sm"
                        checked={providerForm.autoFulfill}
                        onChange={(e) => setProviderForm({ ...providerForm, autoFulfill: e.target.checked })}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 block">Auto-Fulfill</span>
                        <span className="text-[10px] text-stone-500">Auto buy on pay</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-success toggle-sm"
                        checked={providerForm.isActive}
                        onChange={(e) => setProviderForm({ ...providerForm, isActive: e.target.checked })}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 block">Active</span>
                        <span className="text-[10px] text-stone-500">Enable provider</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-info toggle-sm"
                        checked={providerForm.isDefault}
                        onChange={(e) => setProviderForm({ ...providerForm, isDefault: e.target.checked })}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-stone-900 block">Default</span>
                        <span className="text-[10px] text-stone-500">Fallback routing</span>
                      </div>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-800">
                      Internal Notes / Account Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP Telegram bot account, high priority margin"
                      className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50/80 w-full text-xs"
                      value={providerForm.notes}
                      onChange={(e) => setProviderForm({ ...providerForm, notes: e.target.value })}
                    />
                  </div>

                  {/* Live Key Test Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">
                          Test Connection &amp; Balance
                        </span>
                        <span className="text-[11px] text-stone-600 block">
                          Validates API key with supplier before saving
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestProviderKey}
                        disabled={testingProviderKey || !providerForm.apiKey.trim()}
                        className="btn bg-stone-950 hover:bg-stone-800 text-white btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <Zap className={`w-3.5 h-3.5 ${testingProviderKey ? "animate-spin" : "text-amber-400"}`} />
                        <span>{testingProviderKey ? "Testing..." : "Test Key"}</span>
                      </button>
                    </div>

                    {testProviderResult && (
                      <div
                        className={`mt-2.5 p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                          testProviderResult.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-rose-50 border-rose-200 text-rose-900"
                        }`}
                      >
                        {testProviderResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span>{testProviderResult.message}</span>
                          {testProviderResult.balanceUsd !== undefined && (
                            <div className="font-mono font-bold mt-1">
                              Live Balance: ${Number(testProviderResult.balanceUsd).toFixed(2)} USD
                              {testProviderResult.balanceVnd !== undefined && ` (${Number(testProviderResult.balanceVnd).toLocaleString()} ₫)`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsProviderModalOpen(false)}
                    className="btn btn-ghost btn-sm rounded-xl font-bold text-stone-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProvider}
                    disabled={savingProvider || !providerForm.name.trim() || !providerForm.apiKey.trim()}
                    className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5 border-none shadow-xs cursor-pointer px-5"
                  >
                    {savingProvider ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{savingProvider ? "Saving..." : editingProvider ? "Update Provider" : "Create Provider"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">Gateway API Key</label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        zinipay_settings: { ...settings.zinipay_settings, apiKey: "sandbox_test_8f4c9a2e7b31" },
                      })
                    }
                    className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Use Sandbox Test Key</span>
                  </button>
                </div>
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
                <span className="text-[11px] text-stone-500 block">
                  Default sandbox key: <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-700 font-mono">sandbox_test_8f4c9a2e7b31</code>
                </span>
              </div>

              {/* Test Result Banner */}
              {testZinipayResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-medium ${
                    testZinipayResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {testZinipayResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testZinipayResult.success ? "Connection Verified" : "Verification Failed"}</span>
                  </div>
                  <p>{testZinipayResult.message}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestZinipay}
                  disabled={testingZinipay}
                  className="btn bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl font-bold btn-sm flex items-center gap-2 cursor-pointer"
                >
                  {testingZinipay ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{testingZinipay ? "Verifying..." : "Test Connection"}</span>
                </button>

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
