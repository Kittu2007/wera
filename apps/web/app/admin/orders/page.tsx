// =============================================================================
// WERA — Admin Order Management
// Section 7.3: Filter, order detail, MF fulfilment, Razorpay refund,
// cancel, CSV export, status update
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Download, Filter, ChevronDown, MoreHorizontal,
  Eye, Truck, XCircle, RefreshCw, ExternalLink, Calendar,
  Package, CreditCard,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";

// ---------------------------------------------------------------------------
// Status badge (shared)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.ordersList.useQuery({
    page,
    limit: 20,
    query: query || undefined,
    status: statusFilter as any,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  // Order detail for expanded row
  const { data: orderDetail } = trpc.admin.orderDetail.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId }
  );

  const cancelMutation = trpc.admin.cancelOrder.useMutation({
    onSuccess: () => {
      utils.admin.ordersList.invalidate();
      setActionMenuId(null);
    },
  });

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => utils.admin.ordersList.invalidate(),
  });

  // CSV export
  const handleExport = () => {
    if (!data?.items) return;
    const header = "Order #,Customer,Email,Status,Total,Items,Date\n";
    const rows = data.items.map((o) =>
      `${o.orderNumber},"${o.user?.name ?? "Guest"}","${o.user?.email ?? ""}",${o.status},${o.total},${o._count.items},${o.createdAt}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wera-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-h1 uppercase tracking-tight text-white">
            Orders
          </h1>
          <p className="text-body-sm text-[#666] mt-1">
            {data?.total ?? 0} total orders
          </p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5
               border border-[#333] text-body-sm text-[#999]
               hover:border-brand-yellow hover:text-brand-yellow transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md flex items-center border border-[#333] bg-[#0d0d0d]">
          <Search className="w-4 h-4 ml-4 text-[#666]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(searchInput)}
            placeholder="Search by order #, email, or name..."
            className="flex-1 bg-transparent px-3 py-2.5 text-body-sm text-white
                       placeholder:text-[#555] focus:outline-none"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={statusFilter ?? ""}
            onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }}
            className="appearance-none bg-[#0d0d0d] border border-[#333] px-4 py-2.5 pr-10
                       text-body-sm text-white cursor-pointer focus:outline-none
                       focus:border-brand-yellow"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                 text-[#666] pointer-events-none" />
        </div>

        {/* Date from */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#666]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-[#0d0d0d] border border-[#333] px-3 py-2.5 text-body-sm text-white
                       focus:outline-none focus:border-brand-yellow"
          />
          <span className="text-[#555]">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-[#0d0d0d] border border-[#333] px-3 py-2.5 text-body-sm text-white
                       focus:outline-none focus:border-brand-yellow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Date
                </th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 w-20 skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((order) => (
                    <>
                      <tr
                        key={order.id}
                        className={`border-b border-[#1a1a1a] hover:bg-[#111] transition-colors
                                  cursor-pointer ${expandedId === order.id ? "bg-[#111]" : ""}`}
                        onClick={() => setExpandedId(
                          expandedId === order.id ? null : order.id
                        )}
                      >
                        <td className="px-6 py-4">
                          <span className="text-body-sm text-brand-yellow font-mono">
                            {order.orderNumber}
                          </span>
                          {order.razorpayPaymentId && (
                            <p className="text-[10px] text-[#555] font-mono mt-0.5">
                              RZP: {order.razorpayPaymentId.slice(0, 12)}...
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-body-sm text-white">
                            {order.user?.name ?? "Guest"}
                          </p>
                          <p className="text-caption text-[#666]">{order.user?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-body-sm text-[#999]">
                          {order._count.items}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-white font-mono">
                          ₹{Number(order.total).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-[#666]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuId(
                                actionMenuId === order.id ? null : order.id
                              )}
                              className="p-1.5 text-[#666] hover:text-white transition-colors"
                              aria-label="Order actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {actionMenuId === order.id && (
                              <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a]
                                             border border-[#333] py-1 w-56 z-10 animate-fade-in">
                                {/* Fulfil via Merch Factory */}
                                {(order.status === "PAYMENT_CONFIRMED" ||
                                  order.status === "PROCESSING") && (
                                  <button
                                    onClick={() => {
                                      updateStatusMutation.mutate({
                                        id: order.id,
                                        status: "PROCESSING",
                                      });
                                      setActionMenuId(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                               text-[#999] hover:text-white hover:bg-[#222]"
                                  >
                                    <Truck className="w-4 h-4 text-brand-yellow" />
                                    Push to Merch Factory
                                  </button>
                                )}

                                {/* Mark as shipped */}
                                {order.status === "IN_PRODUCTION" && (
                                  <button
                                    onClick={() => {
                                      updateStatusMutation.mutate({
                                        id: order.id,
                                        status: "SHIPPED",
                                      });
                                      setActionMenuId(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                               text-[#999] hover:text-white hover:bg-[#222]"
                                  >
                                    <Package className="w-4 h-4" /> Mark Shipped
                                  </button>
                                )}

                                {/* Mark as delivered */}
                                {order.status === "SHIPPED" && (
                                  <button
                                    onClick={() => {
                                      updateStatusMutation.mutate({
                                        id: order.id,
                                        status: "DELIVERED",
                                      });
                                      setActionMenuId(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                               text-[#999] hover:text-white hover:bg-[#222]"
                                  >
                                    <Package className="w-4 h-4 text-emerald-400" /> Mark Delivered
                                  </button>
                                )}

                                {/* Cancel + Refund */}
                                {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Cancel order ${order.orderNumber}? This will auto-refund via Razorpay and cancel on Merch Factory.`)) {
                                        cancelMutation.mutate({ id: order.id });
                                      }
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                               text-red-400 hover:bg-red-500/10"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancel + Auto-Refund
                                  </button>
                                )}

                                {/* View tracking */}
                                {order.trackingUrl && (
                                  <a
                                    href={order.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                                               text-[#999] hover:text-white hover:bg-[#222]"
                                  >
                                    <ExternalLink className="w-4 h-4" /> Track Shipment
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded order detail */}
                      {expandedId === order.id && orderDetail && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={7} className="bg-[#080808] border-b border-[#1a1a1a]">
                            <div className="p-6 grid md:grid-cols-3 gap-8">
                              {/* Items */}
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-4">
                                  Items
                                </h4>
                                <div className="space-y-3">
                                  {orderDetail.items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                      <div className="w-10 h-12 bg-[#1a1a1a] flex-shrink-0 relative">
                                        {item.variant.product.images[0] && (
                                          <img
                                            src={item.variant.product.images[0].url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-body-sm text-white truncate">
                                          {item.variant.product.title}
                                        </p>
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

                              {/* Shipping */}
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-4">
                                  Shipping Address
                                </h4>
                                {orderDetail.shippingAddress && (
                                  <div className="text-body-sm text-[#999] space-y-1">
                                    <p className="text-white font-medium">
                                      {orderDetail.shippingAddress.fullName}
                                    </p>
                                    <p>{orderDetail.shippingAddress.line1}</p>
                                    {orderDetail.shippingAddress.line2 && (
                                      <p>{orderDetail.shippingAddress.line2}</p>
                                    )}
                                    <p>
                                      {orderDetail.shippingAddress.city},{" "}
                                      {orderDetail.shippingAddress.state} —{" "}
                                      {orderDetail.shippingAddress.pincode}
                                    </p>
                                    <p>{orderDetail.shippingAddress.phone}</p>
                                  </div>
                                )}
                              </div>

                              {/* Financials */}
                              <div>
                                <h4 className="font-heading text-label uppercase text-brand-yellow mb-4">
                                  Payment
                                </h4>
                                <div className="space-y-2 text-body-sm">
                                  <div className="flex justify-between">
                                    <span className="text-[#666]">Subtotal</span>
                                    <span className="text-white font-mono">
                                      ₹{Number(orderDetail.subtotal).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  {Number(orderDetail.discount) > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-[#666]">Discount</span>
                                      <span className="text-emerald-400 font-mono">
                                        −₹{Number(orderDetail.discount).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-[#666]">Shipping</span>
                                    <span className="text-white font-mono">
                                      {Number(orderDetail.shipping) === 0 ? "FREE" :
                                        `₹${Number(orderDetail.shipping).toLocaleString("en-IN")}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#666]">GST</span>
                                    <span className="text-white font-mono">
                                      ₹{Number(orderDetail.gst).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div className="h-[1px] bg-[#222] my-2" />
                                  <div className="flex justify-between font-bold">
                                    <span className="text-white">Total</span>
                                    <span className="text-brand-yellow font-mono">
                                      ₹{Number(orderDetail.total).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  {orderDetail.razorpayPaymentId && (
                                    <div className="flex items-center gap-2 mt-3 pt-3
                                                   border-t border-[#1a1a1a]">
                                      <CreditCard className="w-3.5 h-3.5 text-[#666]" />
                                      <span className="text-caption text-[#555] font-mono">
                                        {orderDetail.razorpayPaymentId}
                                      </span>
                                    </div>
                                  )}
                                  {orderDetail.couponCode && (
                                    <div className="mt-2">
                                      <span className="badge text-[8px]">
                                        Coupon: {orderDetail.couponCode}
                                      </span>
                                    </div>
                                  )}
                                </div>
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

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a]">
            <p className="text-body-sm text-[#666]">
              Page {data.page} of {data.totalPages} ({data.total} orders)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.hasPrev}
                className="px-4 py-2 border border-[#333] text-body-sm text-[#999]
                           hover:border-brand-yellow disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasNext}
                className="px-4 py-2 border border-[#333] text-body-sm text-[#999]
                           hover:border-brand-yellow disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
