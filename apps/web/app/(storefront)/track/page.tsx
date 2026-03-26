// =============================================================================
// WERA — Track Order Page (Guest Access)
// Section 15.3: Track order by Number + Email
// =============================================================================

"use client";

import { useState } from "react";
import { Search, Package, MapPin, CheckCircle, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: order, isLoading, error, refetch } = trpc.checkout.trackOrder.useQuery(
    { orderNumber, email },
    { enabled: false, retry: false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) return;
    setHasSearched(true);
    refetch();
  };

  return (
    <div className="container min-h-[60vh] py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-display-sm uppercase tracking-tight text-center mb-4">
          Track Your Order
        </h1>
        <p className="text-body-sm text-[#666] text-center mb-10 max-w-md mx-auto">
          Enter your order number and the email address used during checkout to see the latest shipping updates.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-12">
          <input
            type="text"
            placeholder="Order Number (e.g. ORD-12345)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            required
            className="flex-1 bg-transparent border border-[#333] px-5 py-3.5 text-white
                       focus:outline-none focus:border-brand-yellow placeholder:text-[#555]"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-transparent border border-[#333] px-5 py-3.5 text-white
                       focus:outline-none focus:border-brand-yellow placeholder:text-[#555]"
          />
          <button type="submit" disabled={isLoading} className="btn-primary md:w-auto w-full flex items-center justify-center gap-2">
            {isLoading ? "Searching..." : <><Search className="w-4 h-4" /> Track</>}
          </button>
        </form>

        {/* Results */}
        {hasSearched && error && (
          <div className="bg-red-500/10 border border-red-500/30 p-6 text-center text-red-400">
            {error.message}
          </div>
        )}

        {hasSearched && order && (
          <div className="border border-[#222] bg-[#0d0d0d] p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-8 border-b border-[#222]">
              <div>
                <p className="text-body-sm text-[#666] mb-1">Order Number</p>
                <h2 className="font-heading text-h2 uppercase text-white tracking-tight">
                  {order.orderNumber}
                </h2>
                <p className="text-caption text-[#666] mt-2">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:text-right">
                <p className="text-body-sm text-[#666] mb-1">Current Status</p>
                <span className="inline-block px-4 py-2 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow font-bold uppercase tracking-wider text-xs">
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Timeline (Simplified) */}
              <div className="space-y-6">
                <h3 className="font-heading text-sm uppercase text-[#999] tracking-widest">Progress</h3>
                <div className="relative border-l border-[#333] ml-3 space-y-8 pb-4">
                  <div className="relative pl-6">
                    <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-brand-yellow border-4 border-[#0d0d0d] flex items-center justify-center" />
                    <p className="font-heading uppercase text-white text-sm">Order Confirmed</p>
                  </div>
                  <div className="relative pl-6">
                    <div className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-[#0d0d0d] flex items-center justify-center ${["IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(order.status) ? "bg-brand-yellow" : "bg-[#333]"}`} />
                    <p className={`font-heading uppercase text-sm ${["IN_PRODUCTION", "SHIPPED", "DELIVERED"].includes(order.status) ? "text-white" : "text-[#666]"}`}>Processing</p>
                  </div>
                  <div className="relative pl-6">
                    <div className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-[#0d0d0d] flex items-center justify-center ${["SHIPPED", "DELIVERED"].includes(order.status) ? "bg-brand-yellow" : "bg-[#333]"}`} />
                    <p className={`font-heading uppercase text-sm ${["SHIPPED", "DELIVERED"].includes(order.status) ? "text-white" : "text-[#666]"}`}>Shipped</p>
                    {order.trackingNumber && (
                      <p className="text-caption text-[#999] mt-1 font-mono">AWB: {order.trackingNumber}</p>
                    )}
                  </div>
                  <div className="relative pl-6">
                    <div className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-4 border-[#0d0d0d] flex items-center justify-center ${order.status === "DELIVERED" ? "bg-emerald-500" : "bg-[#333]"}`} />
                    <p className={`font-heading uppercase text-sm ${order.status === "DELIVERED" ? "text-emerald-400" : "text-[#666]"}`}>Delivered</p>
                  </div>
                </div>

                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-yellow text-sm hover:underline mt-4">
                    Track on Carrier Website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="font-heading text-sm uppercase text-[#999] tracking-widest mb-6">Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-body-sm">
                      <div>
                        <p className="text-white">{item.variant.product.title}</p>
                        <p className="text-[#666] text-caption">{item.variant.size} / {item.variant.color} × {item.quantity}</p>
                      </div>
                      <p className="text-white font-mono">₹{Number(item.price).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
