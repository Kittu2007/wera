// =============================================================================
// WERA — Admin Coupons Management
// Section 7.5: %, fixed, free shipping; conditions; usage; expiry
// =============================================================================

"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Tag, Copy, Check, MoreHorizontal, X } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

function CouponTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PERCENTAGE: { label: "% OFF", className: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    FIXED: { label: "FLAT", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    FREE_SHIPPING: { label: "FREE SHIP", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  };
  const info = map[type] ?? { label: type, className: "bg-[#222] text-[#666]" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold
                     uppercase tracking-wider border ${info.className}`}>
      {info.label}
    </span>
  );
}

export default function AdminCouponsPage() {
  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.admin.couponsList.useQuery({});
  const deleteMutation = trpc.admin.deleteCoupon.useMutation({
    onSuccess: () => utils.admin.couponsList.invalidate(),
  });
  const createMutation = trpc.admin.createCoupon.useMutation({
    onSuccess: () => { utils.admin.couponsList.invalidate(); setShowForm(false); resetForm(); },
  });

  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const resetForm = () => {
    setCode(""); setType("PERCENTAGE"); setValue(""); setMinOrderValue("");
    setMaxUses(""); setExpiresAt("");
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setCode(`WERA${random}`);
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-h1 uppercase tracking-tight text-white">Coupons</h1>
          <p className="text-body-sm text-[#666] mt-1">{coupons?.total ?? 0} total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
                className="btn-primary py-2.5 text-xs flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-brand-yellow/30 p-6 mb-8 animate-fade-in max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-sm uppercase tracking-tight text-brand-yellow">
              New Coupon
            </h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-[#666] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              code,
              type,
              value: value,
              minOrderValue: minOrderValue || undefined,
              maxUses: maxUses ? parseInt(maxUses) : undefined,
              expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            });
          }} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Code</label>
                <div className="flex gap-2">
                  <input type="text" value={code}
                         onChange={(e) => setCode(e.target.value.toUpperCase())}
                         required placeholder="WERA20"
                         className="flex-1 bg-transparent border border-[#333] px-4 py-3
                         text-white font-mono text-body-sm focus:outline-none focus:border-brand-yellow" />
                  <button type="button" onClick={generateCode}
                          className="px-4 py-3 bg-[#222] text-white text-xs hover:bg-[#333] transition-colors">
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)}
                        className="w-full appearance-none bg-transparent border border-[#333] px-4 py-3
                        text-white text-body-sm focus:outline-none focus:border-brand-yellow">
                  <option value="PERCENTAGE" className="bg-brand-black">Percentage Off</option>
                  <option value="FIXED" className="bg-brand-black">Fixed Amount</option>
                  <option value="FREE_SHIPPING" className="bg-brand-black">Free Shipping</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">
                  {type === "PERCENTAGE" ? "Discount %" : type === "FIXED" ? "Amount (₹)" : "Value"}
                </label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
                       required={type !== "FREE_SHIPPING"} placeholder={type === "PERCENTAGE" ? "20" : "500"}
                       className="w-full bg-transparent border border-[#333] px-4 py-3
                       text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
              </div>
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Min Order (₹)</label>
                <input type="number" value={minOrderValue}
                       onChange={(e) => setMinOrderValue(e.target.value)} placeholder="999"
                       className="w-full bg-transparent border border-[#333] px-4 py-3
                       text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Max Uses</label>
                <input type="number" value={maxUses}
                       onChange={(e) => setMaxUses(e.target.value)} placeholder="100"
                       className="w-full bg-transparent border border-[#333] px-4 py-3
                       text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
              </div>
              <div>
                <label className="font-heading text-label uppercase text-[#999] mb-1.5 block">Expiry Date</label>
                <input type="date" value={expiresAt}
                       onChange={(e) => setExpiresAt(e.target.value)}
                       className="w-full bg-transparent border border-[#333] px-4 py-3
                       text-white text-body-sm focus:outline-none focus:border-brand-yellow" />
              </div>
            </div>

            <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Coupon"}
            </button>
          </form>
        </div>
      )}

      {/* Coupons grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 skeleton" />
          ))}
        </div>
      ) : coupons && coupons.items.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.items.map((coupon) => (
            <div key={coupon.id}
                 className={`border p-5 transition-colors ${
                   coupon.isActive ? "border-[#222] hover:border-brand-yellow/30" : "border-[#1a1a1a] opacity-50"
                 }`}>
              <div className="flex items-center justify-between mb-3">
                <CouponTypeBadge type={coupon.type} />
                <span className={`text-[10px] font-bold uppercase ${
                  coupon.isActive ? "text-emerald-400" : "text-[#555]"
                }`}>
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <code className="font-mono text-h3 text-white">{coupon.code}</code>
                <button onClick={() => copyCode(coupon.code)}
                        className="p-1 text-[#666] hover:text-brand-yellow transition-colors"
                        aria-label="Copy code">
                  {copiedCode === coupon.code ? (
                    <Check className="w-4 h-4 text-brand-yellow" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="space-y-1 text-body-sm text-[#999]">
                <p>
                  {coupon.type === "PERCENTAGE"
                    ? `${coupon.value}% off`
                    : coupon.type === "FIXED"
                      ? `₹${coupon.value} off`
                      : "Free shipping"}
                  {coupon.minOrderValue && ` • Min ₹${coupon.minOrderValue}`}
                </p>
                <p>
                  Used: {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""}
                  {coupon.expiresAt && ` • Expires ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}`}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => {
                          if (confirm(`Delete coupon ${coupon.code}?`)) {
                            deleteMutation.mutate({ id: coupon.id });
                          }
                        }}
                        className="p-2 text-[#555] hover:text-red-400 transition-colors"
                        aria-label="Delete coupon">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-[#1a1a1a]">
          <Tag className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-h3 font-heading uppercase tracking-tight text-[#555]">No coupons yet</p>
        </div>
      )}
    </div>
  );
}
