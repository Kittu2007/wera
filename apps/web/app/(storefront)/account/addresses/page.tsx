// =============================================================================
// WERA — Address Book
// Section 6.6: Add/edit/delete/set default addresses
// =============================================================================

"use client";

import { useState } from "react";
import { MapPin, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
];

export default function AddressesPage() {
  const utils = trpc.useUtils();
  const { data: addresses, isLoading } = trpc.account.addresses.useQuery();

  const createMutation = trpc.account.createAddress.useMutation({
    onSuccess: () => { utils.account.addresses.invalidate(); setShowForm(false); resetForm(); },
  });

  const updateMutation = trpc.account.updateAddress.useMutation({
    onSuccess: () => { utils.account.addresses.invalidate(); setEditingId(null); resetForm(); },
  });

  const deleteMutation = trpc.account.deleteAddress.useMutation({
    onSuccess: () => utils.account.addresses.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setFullName(""); setPhone(""); setLine1(""); setLine2("");
    setCity(""); setState(""); setPincode(""); setIsDefault(false);
  };

  const startEdit = (addr: any) => {
    setEditingId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone ?? "");
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { fullName, phone, line1, line2: line2 || undefined, city, state, pincode, isDefault };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading text-h2 uppercase tracking-tight">Addresses</h2>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
            className="btn-primary py-2.5 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-brand-yellow/30 p-6 mb-8
                                                animate-fade-in space-y-5 max-w-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm uppercase tracking-tight text-brand-yellow">
              {editingId ? "Edit Address" : "New Address"}
            </h3>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="p-1 text-[#666] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">
                Full Name
              </label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                     required className="w-full bg-transparent border border-[#333] px-4 py-3
                     text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">
                Phone
              </label>
              <input type="tel" value={phone} inputMode="tel"
                     onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                     className="w-full bg-transparent border border-[#333] px-4 py-3
                     text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
            </div>
          </div>

          <div>
            <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">
              Address Line 1
            </label>
            <input type="text" value={line1} onChange={(e) => setLine1(e.target.value)}
                   required className="w-full bg-transparent border border-[#333] px-4 py-3
                   text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
          </div>

          <div>
            <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">
              Address Line 2
            </label>
            <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)}
                   className="w-full bg-transparent border border-[#333] px-4 py-3
                   text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                     required className="w-full bg-transparent border border-[#333] px-4 py-3
                     text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
            </div>
            <div>
              <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} required
                      className="w-full appearance-none bg-transparent border border-[#333] px-4 py-3
                      text-white text-body-sm focus:outline-none focus:border-brand-yellow">
                <option value="" className="bg-brand-black">Select</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} className="bg-brand-black">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Pincode</label>
              <input type="text" inputMode="numeric" maxLength={6} value={pincode}
                     onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                     required className="w-full bg-transparent border border-[#333] px-4 py-3
                     text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors
                           ${isDefault ? "border-brand-yellow bg-brand-yellow" : "border-[#555]"}`}>
              {isDefault && <Check className="w-3 h-3 text-brand-black" />}
            </div>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                   className="sr-only" />
            <span className="text-body-sm text-[#999]">Set as default address</span>
          </label>

          <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary disabled:opacity-50">
            {editingId ? "Update Address" : "Save Address"}
          </button>
        </form>
      )}

      {/* Address list */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id}
                 className={`border p-5 transitin-colors ${
                   addr.isDefault ? "border-brand-yellow/40" : "border-[#222] hover:border-[#333]"
                 }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#666]" />
                  {addr.isDefault && <span className="badge text-[8px] py-0.5">Default</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(addr)}
                          className="p-1.5 text-[#666] hover:text-brand-yellow transition-colors"
                          aria-label="Edit address">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => {
                            if (confirm("Delete this address?")) {
                              deleteMutation.mutate({ id: addr.id });
                            }
                          }}
                          className="p-1.5 text-[#666] hover:text-red-400 transition-colors"
                          aria-label="Delete address">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-body-sm text-white font-medium">{addr.fullName}</p>
              <p className="text-body-sm text-[#999] mt-1">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
              </p>
              <p className="text-body-sm text-[#999]">
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              {addr.phone && <p className="text-caption text-[#666] mt-2">{addr.phone}</p>}
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="py-16 text-center border border-[#222]">
          <MapPin className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="font-heading text-h3 uppercase tracking-tight text-[#555] mb-2">
            No saved addresses
          </p>
          <p className="text-body-sm text-[#666] mb-6">
            Add an address for faster checkout.
          </p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary"
          >
            Add Address
          </button>
        </div>
      ) : null}
    </div>
  );
}
