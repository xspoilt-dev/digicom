"use client";

import { useEffect, useState } from "react";

const SettingsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    company_info: { name: "", address: "", email: "", telegram: "", bkashNumber: "" },
    meta_pixel: { pixelId: "", accessToken: "", testEventCode: "" },
  });
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchSettings();
  }, [apiUrl]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
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
          company_info: data.settings.company_info || { name: "", address: "", email: "", telegram: "", bkashNumber: "" },
          meta_pixel: data.settings.meta_pixel || { pixelId: "", accessToken: "", testEventCode: "" },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (key: string, value: any) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/settings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Settings configuration updated successfully.");
        fetchSettings();
      }
    } catch (err) {
      alert("Error updating settings config.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-base-content">System Configuration</h1>
        <p className="text-xs text-base-content/65 font-semibold mt-1">Configure company profiles, support routes, and Meta tracking identifiers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Brand & Support Settings Form */}
        <div className="card bg-base-100 border border-base-300 p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-black text-base-content border-b border-base-200 pb-3 flex items-center gap-2">
            <SettingsIcon /> Brand & Support Settings
          </h3>
          
          <div className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Company / Brand Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
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
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Support Contact Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.company_info.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_info: { ...settings.company_info, email: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">bKash Personal Wallet Number</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.company_info.bkashNumber}
                placeholder="e.g. 017xxxxxxxx"
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_info: { ...settings.company_info, bkashNumber: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Telegram Support Link</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.company_info.telegram}
                placeholder="e.g. t.me/username"
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_info: { ...settings.company_info, telegram: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <button
            onClick={() => handleSettingsSubmit("company_info", settings.company_info)}
            className="btn btn-primary rounded-xl font-bold shadow-md w-full mt-4"
          >
            Save Brand Settings
          </button>
        </div>

        {/* Meta Pixel & Conversions API Settings Form */}
        <div className="card bg-base-100 border border-base-300 p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-black text-base-content border-b border-base-200 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg> Meta Pixel & Conversions API
          </h3>

          <div className="space-y-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Meta Pixel ID</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.meta_pixel.pixelId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meta_pixel: { ...settings.meta_pixel, pixelId: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Meta Conversions API Token</span>
              </label>
              <input
                type="password"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.meta_pixel.accessToken}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meta_pixel: { ...settings.meta_pixel, accessToken: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-base-content/80">Meta Test Event Code (Optional)</span>
              </label>
              <input
                type="text"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={settings.meta_pixel.testEventCode}
                placeholder="e.g. TEST12345"
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meta_pixel: { ...settings.meta_pixel, testEventCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <button
            onClick={() => handleSettingsSubmit("meta_pixel", settings.meta_pixel)}
            className="btn btn-primary rounded-xl font-bold shadow-md w-full mt-4"
          >
            Save Pixel Settings
          </button>
        </div>
      </div>
    </div>
  );
}
