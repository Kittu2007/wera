// =============================================================================
// WERA — Admin Store Settings
// Section 7.8: General, Shipping, Payments, Tax, Email, Social, SEO, Notifications
// =============================================================================

"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";

type SettingsTab = "general" | "shipping" | "payments" | "tax" | "email" | "social" | "seo" | "notifications";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "shipping", label: "Shipping" },
  { key: "payments", label: "Payments" },
  { key: "tax", label: "Tax" },
  { key: "email", label: "Email" },
  { key: "social", label: "Social" },
  { key: "seo", label: "SEO" },
  { key: "notifications", label: "Notifications" },
];

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-heading text-label uppercase text-[#999] mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ placeholder, value, disabled }: { placeholder?: string; value?: string; disabled?: boolean }) {
  return (
    <input type="text" placeholder={placeholder} defaultValue={value} disabled={disabled}
           className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white
           placeholder:text-[#555] focus:outline-none focus:border-brand-yellow
           disabled:bg-[#0d0d0d] disabled:text-[#666] disabled:cursor-not-allowed" />
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="font-heading text-h1 uppercase tracking-tight text-white mb-8">Settings</h1>

      <div className="grid lg:grid-cols-[220px,1fr] gap-8">
        {/* Sidebar tabs */}
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-yellow/10 text-brand-yellow border-l-2 border-brand-yellow"
                  : "text-[#999] hover:text-white hover:bg-[#111]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-8">
          {activeTab === "general" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">General</h2>
              <SettingsField label="Store Name">
                <TextInput value="WERA" />
              </SettingsField>
              <SettingsField label="Timezone">
                <TextInput value="Asia/Kolkata" disabled />
              </SettingsField>
              <SettingsField label="Currency">
                <TextInput value="INR (₹)" disabled />
              </SettingsField>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Shipping</h2>
              <SettingsField label="Free Shipping Threshold (₹)">
                <TextInput value="999" />
              </SettingsField>
              <SettingsField label="Standard Flat Rate (₹)">
                <TextInput value="99" />
              </SettingsField>
              <SettingsField label="Express Flat Rate (₹)">
                <TextInput value="199" />
              </SettingsField>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Payments</h2>
              <SettingsField label="Razorpay Key ID">
                <TextInput placeholder="rzp_live_..." />
              </SettingsField>
              <SettingsField label="Razorpay Key Secret">
                <TextInput placeholder="••••••••" />
              </SettingsField>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-brand-yellow bg-brand-yellow flex items-center justify-center">
                  <Check className="w-3 h-3 text-brand-black" />
                </div>
                <span className="text-body-sm text-[#999]">Live mode (uncheck for test mode)</span>
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Tax</h2>
              <SettingsField label="GST Rate (%)">
                <TextInput value="18" />
              </SettingsField>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#555] flex items-center justify-center" />
                <span className="text-body-sm text-[#999]">Tax-inclusive pricing</span>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Email</h2>
              <SettingsField label="From Name">
                <TextInput value="WERA" />
              </SettingsField>
              <SettingsField label="From Email">
                <TextInput value="hello@wera.in" />
              </SettingsField>
              <SettingsField label="Email Footer HTML">
                <textarea defaultValue="<p>WERA • Streetwear That Speaks</p>"
                          rows={3}
                          className="w-full bg-transparent border border-[#333] px-5 py-3.5
                          text-white font-mono text-body-sm focus:outline-none focus:border-brand-yellow" />
              </SettingsField>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Social</h2>
              <SettingsField label="Instagram"><TextInput placeholder="@wera.in" /></SettingsField>
              <SettingsField label="YouTube"><TextInput placeholder="@wera" /></SettingsField>
              <SettingsField label="Twitter / X"><TextInput placeholder="@wera" /></SettingsField>
              <SettingsField label="WhatsApp"><TextInput placeholder="+91..." /></SettingsField>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">SEO</h2>
              <SettingsField label="Default Meta Title">
                <TextInput value="WERA — Streetwear That Speaks" />
              </SettingsField>
              <SettingsField label="Default Meta Description">
                <textarea defaultValue="Bold streetwear for the culture. Print-on-demand fashion."
                          rows={3}
                          className="w-full bg-transparent border border-[#333] px-5 py-3.5
                          text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
              </SettingsField>
              <SettingsField label="Google Analytics ID">
                <TextInput placeholder="G-XXXXXXXXXX" />
              </SettingsField>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-heading text-h3 uppercase tracking-tight mb-6">Notifications</h2>
              <SettingsField label="Admin Email for New Orders">
                <TextInput placeholder="admin@wera.in" />
              </SettingsField>
              <div className="space-y-3">
                {[
                  "Email me on new orders",
                  "Daily summary email",
                  "Low stock alerts",
                  "New review notifications",
                ].map((label) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <div className="w-5 h-5 border-2 border-brand-yellow bg-brand-yellow
                                   flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-black" />
                    </div>
                    <span className="text-body-sm text-[#999]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {saved ? (
                <><Check className="w-4 h-4" /> Saved</>
              ) : (
                <><Save className="w-4 h-4" /> Save Settings</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
