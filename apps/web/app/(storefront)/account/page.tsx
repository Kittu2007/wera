// =============================================================================
// WERA — User Profile Page
// Section 6.6: Name, email, phone, profile picture
// =============================================================================

"use client";

import { useState } from "react";
import { Check, Camera } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export default function ProfilePage() {
  const { data: profile, isLoading } = trpc.account.profile.useQuery();
  const updateMutation = trpc.account.updateProfile.useMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate state when profile loads
  if (profile && !name && !phone) {
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 skeleton" />
        <div className="h-20 w-20 skeleton rounded-full" />
        <div className="space-y-4 max-w-md">
          <div className="h-12 skeleton" />
          <div className="h-12 skeleton" />
          <div className="h-12 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-h2 uppercase tracking-tight mb-8">Profile</h2>

      {/* Avatar */}
      <div className="mb-8">
        <div className="relative w-20 h-20 bg-brand-yellow/10 border border-brand-yellow/30
                       flex items-center justify-center group">
          <span className="font-heading text-h1 text-brand-yellow">
            {(profile?.name ?? profile?.email ?? "U")[0]?.toUpperCase()}
          </span>
          <button
            className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100
                       flex items-center justify-center transition-opacity"
            aria-label="Change profile picture"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <div>
          <label className="font-heading text-label uppercase text-[#999] mb-2 block">
            Email
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            disabled
            className="w-full bg-[#0d0d0d] border border-[#222] px-5 py-3.5 text-[#666]
                       cursor-not-allowed"
          />
          <p className="text-caption text-[#555] mt-1">Email cannot be changed here</p>
        </div>

        <div>
          <label className="font-heading text-label uppercase text-[#999] mb-2 block">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white
                       focus:outline-none focus:border-brand-yellow"
          />
        </div>

        <div>
          <label className="font-heading text-label uppercase text-[#999] mb-2 block">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="tel"
            className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white
                       focus:outline-none focus:border-brand-yellow"
          />
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Saved</>
          ) : updateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-brand-black border-t-transparent animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
