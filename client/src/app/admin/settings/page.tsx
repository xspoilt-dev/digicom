"use client";

import { useEffect, useState } from "react";
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
  Key,
  CreditCard,
  ChevronRight,
  Eye,
  EyeOff,
  Wallet,
  DollarSign,
  Server,
  Zap,
  Sparkles,
  Bot,
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

export default function SettingsPage() {
  const { showAlert, showConfirm } = useModal();
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
          message: "Settings configuration updated successfully.",
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
        message: "Error updating settings.",
        type: "error",
      });
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
      <div className="flex items-center justify-center p-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-amber-500" /> System Configuration
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
          Configure company profile, bKash instructions, Meta Pixel & Conversions API (CAPI), and email gateways
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Brand & Support Settings Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-500" /> Brand & Support Settings
            </h2>
            <p className="text-xs text-stone-500 mt-1">Public store identity and payment instructions shown to customers</p>
          </div>
          
          <div className="space-y-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Company / Brand Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-semibold"
                value={settings.company_info.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_info: { ...settings.company_info, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Support Contact Email</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm pl-10"
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

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">bKash / Nagad Wallet Number</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. 017xxxxxxxx"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm pl-10 font-mono font-bold"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500 font-medium">
                  Website Notice: Bkash/nagad er maddhome payment korun
                </span>
              </label>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">WhatsApp Support Number</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. 017xxxxxxxx or +88017xxxxxxxx"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm pl-10 font-mono"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">Linked in store footer and order confirmation</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => handleSettingsSubmit("company_info", settings.company_info)}
            className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full"
          >
            Save Brand Settings
          </button>
        </div>

        {/* Meta Pixel & Conversions API Settings Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> Meta Pixel & Conversions API (CAPI)
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Dual-dispatch tracking with shared eventId deduplication and SHA-256 hashing
            </p>
          </div>

          <div className="space-y-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Meta Pixel ID</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-mono font-bold"
                value={settings.meta_pixel.pixelId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meta_pixel: { ...settings.meta_pixel, pixelId: e.target.value.trim() },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Meta Conversions API Access Token (EAAG...)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showTokens["capi"] ? "text" : "password"}
                  placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxx..."
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm pr-10 font-mono text-xs"
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

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Meta Test Event Code (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TEST12345 (Leave blank in production)"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-mono"
                value={settings.meta_pixel.testEventCode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meta_pixel: { ...settings.meta_pixel, testEventCode: e.target.value.trim() },
                  })
                }
              />
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Find this in Meta Events Manager &gt; Test Events tab
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleSettingsSubmit("meta_pixel", settings.meta_pixel)}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex-1"
            >
              Save Pixel Settings
            </button>
            <button
              onClick={handleTestCapi}
              disabled={testingCapi || !settings.meta_pixel.pixelId || !settings.meta_pixel.accessToken}
              className="btn bg-stone-900 hover:bg-stone-800 text-white border-none rounded-xl font-bold flex items-center gap-2"
            >
              {testingCapi ? (
                <span className="loading loading-spinner loading-xs text-amber-400"></span>
              ) : (
                <Send className="w-4 h-4 text-amber-400" />
              )}
              <span>Send Test CAPI Event</span>
            </button>
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
              {testCapiResult.response && (
                <pre className="bg-stone-900 text-stone-100 p-2.5 rounded-xl font-mono text-[10px] overflow-x-auto mt-2">
                  {JSON.stringify(testCapiResult.response, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Real-time Meta CAPI Event Delivery Logs Section */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" /> Meta CAPI Live Delivery Logs
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Real-time tracking of server events dispatched to Meta Graph API v21.0
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCapiLogs}
                disabled={loadingLogs}
                className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleClearCapiLogs}
                className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-1.5"
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
                          className="btn btn-xs bg-amber-100 hover:bg-amber-200 text-stone-950 font-bold rounded-lg border-none"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-stone-400 font-medium">
                      {loadingLogs ? "Loading CAPI logs..." : "No CAPI events logged yet. Fire a test event or browse the store."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inspect Modal */}
          {selectedLog && (
            <div className="modal modal-open">
              <div className="modal-box rounded-3xl max-w-2xl bg-white border border-stone-200 shadow-2xl p-6 text-stone-900">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                  <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    CAPI Event Payload: {selectedLog.eventName}
                  </h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="btn btn-sm btn-ghost btn-circle"
                  >
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
                    <div>
                      <span className="text-stone-500 block font-semibold">Customer Email (Masked)</span>
                      <span className="font-mono">{selectedLog.userDataMasked?.emailMasked || "None"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block font-semibold">Customer Phone (Masked)</span>
                      <span className="font-mono">{selectedLog.userDataMasked?.phoneMasked || "None"}</span>
                    </div>
                  </div>

                  {selectedLog.errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                      Error: {selectedLog.errorMessage}
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-stone-700 block mb-1">Meta Graph API Response:</span>
                    <pre className="bg-stone-900 text-stone-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                      {JSON.stringify(selectedLog.responseBody, null, 2)}
                    </pre>
                  </div>

                  {selectedLog.customData && Object.keys(selectedLog.customData).length > 0 && (
                    <div>
                      <span className="font-bold text-stone-700 block mb-1">Custom Data:</span>
                      <pre className="bg-stone-900 text-stone-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                        {JSON.stringify(selectedLog.customData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="modal-action mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="btn btn-sm bg-stone-900 text-white rounded-xl px-5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resend Email Dispatcher Settings Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-2">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" /> Resend Email Gateway Configuration
            </h2>
            <p className="text-xs text-stone-500 mt-1">Automatic delivery receipt and digital download link dispatching</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Resend API Key</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showTokens["resend"] ? "text" : "password"}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxx"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-mono pr-10"
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
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">From Domain Email (Authorized in Resend)</span>
              </label>
              <input
                type="text"
                placeholder="Kalobazar.shop <noreply@kalobazar.shop>"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm"
                value={settings.email_settings.fromEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email_settings: { ...settings.email_settings, fromEmail: e.target.value.trim() },
                  })
                }
              />
            </div>
          </div>

          <button
            onClick={() => handleSettingsSubmit("email_settings", settings.email_settings)}
            className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full"
          >
            Save Email Gateway Configurations
          </button>
        </div>

        {/* Payment Gateway Configuration Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" /> Hosted Payment Gateway Integration
              </h2>
              <p className="text-xs text-stone-500 mt-1">Automated invoice generation and instant verification</p>
            </div>
            <span className="badge bg-emerald-100 text-emerald-800 border-none font-bold text-xs py-2 px-3">
              Active Hosted Gateway
            </span>
          </div>

          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-bold text-xs text-stone-700">Gateway API Key</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showTokens["gateway"] ? "text" : "password"}
                placeholder="sandbox_test_... or live_prod_..."
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full font-mono text-xs pr-10"
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
            className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full"
          >
            Save Gateway Key
          </button>
        </div>

        {/* Canboso Buyer API & Upstream Automation Settings Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-500" /> Canboso Buyer API & Upstream Automation
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Automated stock import, real-time fulfillment purchase, and currency conversion rate
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCheckCanbosoBalance}
                disabled={checkingCanbosoBalance || !settings.canboso_settings.apiKey}
                className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Wallet className={`w-3.5 h-3.5 ${checkingCanbosoBalance ? "animate-spin" : "text-amber-500"}`} />
                <span>{checkingCanbosoBalance ? "Checking Balance..." : "Check Wallet Balance"}</span>
              </button>
            </div>
          </div>

          {/* Upstream Balance Banner */}
          {canbosoBalance && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block uppercase tracking-wider">
                    Canboso Upstream Balance
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-stone-950">
                      ${Number(canbosoBalance.balanceUsd || 0).toFixed(2)} USD
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      ({Number(canbosoBalance.balanceVnd || 0).toLocaleString()} VND)
                    </span>
                  </div>
                </div>
              </div>
              <span className="badge bg-emerald-100 text-emerald-800 border-none font-bold text-xs py-2 px-3">
                Live & Connected
              </span>
            </div>
          )}

          {canbosoBalanceError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{canbosoBalanceError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">
                  Canboso Buyer API Bearer Token
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showTokens["canboso"] ? "text" : "password"}
                  placeholder="e.g. 19|GzN5x7g84K3xV69NmsGf9oI17i8oO... (From Canboso Developer Dashboard)"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full font-mono text-xs pr-10"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Endpoint: https://canboso.com/api/v2/telegram-buyer (Purchases & Balance queries)
                </span>
              </label>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">
                  Dollar Exchange Rate (BDT per 1 USD)
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="127"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-bold pl-10"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Default: 127 BDT per Dollar. Used for storefront pricing and admin accounting ledger.
                </span>
              </label>
            </div>

            <div className="form-control w-full flex flex-col justify-center">
              <label className="label cursor-pointer justify-start gap-3 p-0 mt-2">
                <input
                  type="checkbox"
                  className="toggle toggle-warning"
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
                <div>
                  <span className="label-text font-bold text-xs text-stone-800 block">
                    Instant Automated Fulfillment
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Automatically triggers upstream Canboso purchase & delivers digital credentials upon payment
                  </span>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={() => handleSettingsSubmit("canboso_settings", settings.canboso_settings)}
            className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm w-full"
          >
            Save Canboso API Settings
          </button>
        </div>

        {/* OpenRouter AI Marketing Copywriter Settings Form */}
        <div className="bg-white border-2 border-stone-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> OpenRouter AI Marketing Copywriter
                </h2>
                <span className="badge bg-amber-100 text-amber-900 border-none font-bold text-xs py-1 px-2.5">
                  Bangla Marketing AI
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Generate high-converting Bengali product titles and comprehensive marketing descriptions for Bangladeshi customers directly from Canboso product details.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5 text-amber-500" />
                <span>Browse Models</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OpenRouter API Key */}
            <div className="form-control w-full md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">
                  OpenRouter API Key (sk-or-v1-...)
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showTokens["openrouter"] ? "text" : "password"}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full font-mono text-xs pr-10"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Get your free or paid API key from{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 underline font-semibold"
                  >
                    openrouter.ai/keys
                  </a>
                  . Free models like <span className="font-mono font-bold text-stone-700">google/gemma-4-26b-a4b-it:free</span> require zero cost!
                </span>
              </label>
            </div>

            {/* Quick Model Selector Dropdown */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">Choose Model Preset</span>
              </label>
              <select
                className="select select-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl bg-stone-50 text-stone-900 text-xs font-semibold"
                value={
                  [
                    "google/gemma-4-26b-a4b-it:free",
                    "meta-llama/llama-3.3-70b-instruct:free",
                    "deepseek/deepseek-chat",
                    "deepseek/deepseek-r1:free",
                    "meta-llama/llama-3.1-8b-instruct:free",
                    "mistralai/mistral-small-24b-instruct-2501:free",
                    "openai/gpt-4o-mini",
                    "anthropic/claude-3.5-sonnet",
                  ].includes(settings.openrouter_settings?.model)
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
                <option value="google/gemma-4-26b-a4b-it:free">google/gemma-4-26b-a4b-it:free (Free & Fast - Recommended)</option>
                <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free (Free - High Quality 70B)</option>
                <option value="deepseek/deepseek-chat">deepseek/deepseek-chat (DeepSeek V3 - High Quality & Ultra Low Cost)</option>
                <option value="deepseek/deepseek-r1:free">deepseek/deepseek-r1:free (Free - DeepSeek Reasoning)</option>
                <option value="meta-llama/llama-3.1-8b-instruct:free">meta-llama/llama-3.1-8b-instruct:free (Free - Ultra Fast)</option>
                <option value="mistralai/mistral-small-24b-instruct-2501:free">mistralai/mistral-small-24b-instruct-2501:free (Free - Mistral 24B)</option>
                <option value="openai/gpt-4o-mini">openai/gpt-4o-mini (OpenAI Fast)</option>
                <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet (Claude 3.5 Sonnet)</option>
                <option value="custom">Custom Model (Paste or Type Any OpenRouter Model ID)</option>
              </select>
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">Pick from popular free & paid models or paste below</span>
              </label>
            </div>

            {/* Custom Model Text Input */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">
                  Model ID (or Paste Any Custom Model)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. google/gemma-4-26b-a4b-it:free"
                className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-mono font-bold"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Exact model identifier (e.g. <span className="font-mono font-bold">google/gemma-4-26b-a4b-it:free</span>)
                </span>
              </label>
            </div>

            {/* Custom Instructions */}
            <div className="form-control w-full md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-stone-700">
                  Custom Tone & Rules (Optional)
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. সর্বদাই ইনস্ট্যান্ট অটো ডেলিভারি এবং ফুল মেয়াদ রিপ্লেসমেন্ট ওয়ারেন্টির কথা বিশেষভাবে উল্লেখ করবে।"
                className="textarea textarea-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs"
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
              <label className="label py-1">
                <span className="label-text-alt text-stone-500">
                  Extra marketing instructions appended to the AI prompt for store-specific tone or warranty details.
                </span>
              </label>
            </div>
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
                <div className="font-mono text-[11px] text-stone-700 bg-white/80 p-2 rounded-lg border border-emerald-100 mt-1">
                  Model Output: &quot;{testAiResult.response}&quot; (Model: {testAiResult.model})
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleSettingsSubmit("openrouter_settings", settings.openrouter_settings)}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex-1"
            >
              Save OpenRouter AI Settings
            </button>
            <button
              type="button"
              onClick={handleTestAi}
              disabled={testingAi || !settings.openrouter_settings?.apiKey}
              className="btn bg-stone-900 hover:bg-stone-800 text-white border-none rounded-xl font-bold flex items-center gap-2 px-6"
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
    </div>
  );
}
