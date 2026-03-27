// =============================================================================
// WERA — Order History Page
// Section 6.6: Filterable, searchable order list with detail view
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronDown, ExternalLink, Package } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    PAYMENT_CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    PROCESSING: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    IN_PRODUCTION: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    SHIPPED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
    REFUNDED: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold
                     uppercase tracking-wider border ${styles[status] ?? "bg-[#222] text-[#666]"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders, isLoading } = trpc.account.orders.useQuery({
    query: query || undefined,
    status: statusFilter as any,
  });

  const { data: detail } = trpc.account.orderDetail.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId }
  );

  return (
    <div>
      <h2 className="font-heading text-h2 uppercase tracking-tight mb-8">Orders</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-sm flex items-center border border-[#333]">
          <Search className="w-4 h-4 ml-4 text-[#666]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order #..."
            className="flex-1 bg-transparent px-3 py-2.5 text-body-sm text-white
                       placeholder:text-[#555] focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter ?? ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="appearance-none bg-transparent border border-[#333] px-4 py-2.5 pr-10
                       text-body-sm text-white cursor-pointer focus:outline-none
                       focus:border-brand-yellow"
          >
            <option value="" className="bg-brand-black">All</option>
            <option value="SHIPPED" className="bg-brand-black">Shipped</option>
            <option value="DELIVERED" className="bg-brand-black">Delivered</option>
            <option value="CANCELLED" className="bg-brand-black">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                 text-[#666] pointer-events-none" />
        </div>
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton" />
          ))}
        </div>
      ) : orders && orders.items.length > 0 ? (
        <div className="space-y-4">
          {orders.items.map((order: any) => (
            <div key={order.id}>
              <button
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className={`w-full text-left border p-5 transition-colors ${
                  expandedId === order.id
                    ? "border-brand-yellow bg-brand-yellow/5"
                    : "border-[#222] hover:border-[#333]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Package className="w-5 h-5 text-[#555]" />
                    <div>
                      <span className="text-body-sm text-brand-yellow font-mono">
                        {order.orderNumber}
                      </span>
                      <p className="text-caption text-[#666] mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="font-heading text-white">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === order.id && detail && (
                <div className="border border-t-0 border-brand-yellow/30 bg-[#0a0a0a] p-6
                               animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Items */}
                    <div>
                      <h4 className="font-heading text-label uppercase text-brand-yellow mb-4">
                        Items
                      </h4>
                      <div className="space-y-3">
                        {detail.items.map((item: any) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-14 h-16 bg-[#1a1a1a] flex-shrink-0 relative">
                              {item.variant.product.images[0] && (
                                <Image
                                  src={item.variant.product.images[0].url}
                                  alt={item.variant.product.title}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/products/${item.variant.product.slug}`}
                                className="text-body-sm text-white hover:text-brand-yellow
                                           transition-colors truncate block"
                              >
                                {item.variant.product.title}
                              </Link>
                              <p className="text-caption text-[#666]">
                                {item.variant.size} / {item.variant.color} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-body-sm text-[#999] font-mono">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary + tracking */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-heading text-label uppercase text-brand-yellow mb-4">
                          Summary
                        </h4>
                        <div className="space-y-2 text-body-sm">
                          <div className="flex justify-between">
                            <span className="text-[#666]">Subtotal</span>
                            <span className="text-white font-mono">
                              ₹{Number(detail.subtotal).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#666]">Shipping</span>
                            <span className="text-white font-mono">
                              {Number(detail.shipping) === 0 ? "FREE" : `₹${detail.shipping}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#666]">GST</span>
                            <span className="text-white font-mono">₹{Number(detail.gst).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="h-[1px] bg-[#222]" />
                          <div className="flex justify-between font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-brand-yellow font-mono">
                              ₹{Number(detail.total).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      {detail.trackingUrl && (
                        <a
                          href={detail.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary w-full flex items-center justify-center gap-2 text-xs"
                        >
                          <ExternalLink className="w-4 h-4" /> Track Shipment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-[#222]">
          <Package className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="font-heading text-h3 uppercase tracking-tight text-[#555] mb-2">
            No orders yet
          </p>
          <p className="text-body-sm text-[#666] mb-6">
            Your order history will appear here.
          </p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}
