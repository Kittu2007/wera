// =============================================================================
// WERA — Admin Customer Management
// Section 7.4: List, search, customer profile, LTV, flag/verify
// =============================================================================

"use client";

import { useState } from "react";
import { Search, ChevronDown, Users, ExternalLink, Flag, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.admin.customersList.useQuery({
    page,
    limit: 20,
    query: query || undefined,
  });

  const { data: customerDetail } = trpc.admin.customerDetail.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-h1 uppercase tracking-tight text-white">Customers</h1>
          <p className="text-body-sm text-[#666] mt-1">{data?.total ?? 0} registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md flex items-center border border-[#333] bg-[#0d0d0d]">
          <Search className="w-4 h-4 ml-4 text-[#666]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(searchInput)}
            placeholder="Search by name, email, or phone..."
            className="flex-1 bg-transparent px-3 py-2.5 text-body-sm text-white
                       placeholder:text-[#555] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Customer</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Orders</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Total Spend</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a]">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 w-24 skeleton" /></td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((customer) => (
                    <>
                      <tr
                        key={customer.id}
                        className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-brand-yellow text-xs font-bold uppercase">
                                {(customer.name ?? customer.email)?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-body-sm text-white">{customer.name ?? "—"}</p>
                              <p className="text-caption text-[#666]">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-[#999] font-mono">
                          {customer._count.orders}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-white font-mono">
                          ₹{Number(customer.totalSpend ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-[#666]">
                          {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "2-digit",
                          })}
                        </td>
                      </tr>

                      {/* Expanded detail */}
                      {expandedId === customer.id && customerDetail && (
                        <tr key={`${customer.id}-detail`}>
                          <td colSpan={4} className="bg-[#080808] border-b border-[#1a1a1a]">
                            <div className="p-6 grid md:grid-cols-3 gap-8">
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-3">Profile</h4>
                                <div className="space-y-2 text-body-sm text-[#999]">
                                  <p>Phone: <span className="text-white">{customerDetail.phone ?? "—"}</span></p>
                                  <p>Role: <span className="text-white">{customerDetail.role}</span></p>
                                  <p>First order: <span className="text-white">
                                    {customerDetail.orders[0]
                                      ? new Date(customerDetail.orders[0].createdAt).toLocaleDateString("en-IN")
                                      : "—"}
                                  </span></p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-3">
                                  Recent Orders
                                </h4>
                                {customerDetail.orders.length > 0 ? (
                                  <div className="space-y-2">
                                    {customerDetail.orders.slice(0, 5).map((order) => (
                                      <div key={order.id} className="flex items-center justify-between">
                                        <span className="text-body-sm text-brand-yellow font-mono">
                                          {order.orderNumber}
                                        </span>
                                        <span className="text-body-sm text-white font-mono">
                                          ₹{Number(order.total).toLocaleString("en-IN")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-body-sm text-[#555]">No orders yet</p>
                                )}
                              </div>
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-3">
                                  Addresses
                                </h4>
                                {customerDetail.addresses.length > 0 ? (
                                  <div className="space-y-3">
                                    {customerDetail.addresses.map((addr) => (
                                      <p key={addr.id} className="text-body-sm text-[#999]">
                                        {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-body-sm text-[#555]">No addresses</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a]">
            <p className="text-body-sm text-[#666]">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.hasPrev}
                      className="px-4 py-2 border border-[#333] text-body-sm text-[#999] hover:border-brand-yellow disabled:opacity-30 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNext}
                      className="px-4 py-2 border border-[#333] text-body-sm text-[#999] hover:border-brand-yellow disabled:opacity-30 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
