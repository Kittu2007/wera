// =============================================================================
// WERA — Admin KPI Dashboard
// Section 7.1: Revenue, orders by status, AOV, top products, revenue chart,
// fulfilment queue, recent orders, low stock alerts
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign, ShoppingCart, Users, TrendingUp, AlertTriangle,
  Package, ArrowUp, ArrowDown, ExternalLink, Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";

// ---------------------------------------------------------------------------
// KPI Card component
// ---------------------------------------------------------------------------

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "yellow",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  color?: "yellow" | "green" | "red" | "blue";
}) {
  const colorMap = {
    yellow: "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 hover:border-[#333] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold
                         ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
            {trend.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-[#666] text-body-sm mb-1">{title}</p>
      <p className="font-heading text-h1 text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-caption text-[#555] mt-1">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
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
// Main Dashboard
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  const { data: dashboard, isLoading } = trpc.admin.dashboard.useQuery({ period });
  const { data: topProducts } = trpc.admin.topProducts.useQuery({ limit: 5 });
  const { data: revenueTrend } = trpc.admin.revenueTrend.useQuery({ days: 30 });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-h1 uppercase tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-body-sm text-[#666] mt-1">
            Welcome back. Here&apos;s what&apos;s happening.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex border border-[#222]">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider
                         transition-colors ${
                           period === p
                             ? "bg-brand-yellow text-brand-black"
                             : "text-[#666] hover:text-white"
                         }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Revenue"
          value={`₹${dashboard ? Number(dashboard.totalRevenue).toLocaleString("en-IN") : "..."}`}
          icon={DollarSign}
          color="yellow"
          trend={{ value: "+12.5%", positive: true }}
        />
        <KPICard
          title="Total Orders"
          value={String(dashboard?.totalOrders ?? "...")}
          icon={ShoppingCart}
          color="blue"
          trend={{ value: "+8.2%", positive: true }}
        />
        <KPICard
          title="Avg Order Value"
          value={`₹${dashboard ? Number(dashboard.averageOrderValue).toLocaleString("en-IN") : "..."}`}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="New Customers"
          value={String(dashboard?.newCustomers ?? "...")}
          subtitle={`${dashboard?.returningCustomers ?? 0} returning`}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Alert row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Fulfilment queue */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-brand-yellow" />
            <h3 className="font-heading text-sm uppercase tracking-tight text-white">
              Pending Fulfilment
            </h3>
          </div>
          <p className="font-heading text-display-xl text-brand-yellow">
            {dashboard?.pendingFulfillment ?? "..."}
          </p>
          <p className="text-body-sm text-[#666] mt-2">
            Orders awaiting dispatch to Merch Factory
          </p>
        </div>

        {/* Low stock alerts */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="font-heading text-sm uppercase tracking-tight text-white">
              Low Stock Alerts
            </h3>
          </div>
          <p className={`font-heading text-display-xl ${
            (dashboard?.lowStockCount ?? 0) > 0 ? "text-orange-400" : "text-emerald-400"
          }`}>
            {dashboard?.lowStockCount ?? "..."}
          </p>
          <p className="text-body-sm text-[#666] mt-2">
            Variants with &le;5 units remaining
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,380px] gap-8">
        {/* ============================================================
            REVENUE CHART (simplified bar chart)
            ============================================================ */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-sm uppercase tracking-tight text-white">
              Revenue Trend — Last 30 Days
            </h3>
          </div>
          <div className="h-[250px] flex items-end gap-1">
            {revenueTrend
              ? revenueTrend.map((day, i) => {
                  const maxRevenue = Math.max(
                    ...revenueTrend.map((d) => Number(d.revenue))
                  );
                  const height =
                    maxRevenue > 0
                      ? (Number(day.revenue) / maxRevenue) * 100
                      : 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 group relative"
                      title={`${day.date}: ₹${Number(day.revenue).toLocaleString("en-IN")}`}
                    >
                      <div
                        className="bg-brand-yellow/30 hover:bg-brand-yellow/60 transition-colors
                                  w-full mx-auto"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                     hidden group-hover:block z-10">
                        <div className="bg-[#222] px-3 py-1.5 text-[10px] text-white
                                       whitespace-nowrap border border-[#333]">
                          ₹{Number(day.revenue).toLocaleString("en-IN")}
                          <br />
                          <span className="text-[#666]">{day.orders} orders</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              : Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="flex-1 skeleton h-full" />
                ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-[#555]">
            <span>{revenueTrend?.[0]?.date ?? ""}</span>
            <span>{revenueTrend?.[revenueTrend.length - 1]?.date ?? ""}</span>
          </div>
        </div>

        {/* ============================================================
            TOP 5 PRODUCTS
            ============================================================ */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <h3 className="font-heading text-sm uppercase tracking-tight text-white mb-6">
            Top 5 Products
          </h3>
          <div className="space-y-4">
            {topProducts
              ? topProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <span className="font-heading text-h3 text-[#333] w-6">{i + 1}</span>
                    <div className="w-10 h-10 bg-[#1a1a1a] flex-shrink-0 relative">
                      {product.images[0]?.url && (
                        <img
                          src={product.images[0].url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-white truncate">{product.title}</p>
                      <p className="text-caption text-[#666]">
                        {product.salesCount} sold
                      </p>
                    </div>
                  </div>
                ))
              : Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-5 skeleton" />
                    <div className="w-10 h-10 skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 skeleton" />
                      <div className="h-3 w-1/3 skeleton" />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ============================================================
          ORDERS BY STATUS
          ============================================================ */}
      {dashboard?.ordersByStatus && (
        <div className="mt-8 border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <h3 className="font-heading text-sm uppercase tracking-tight text-white mb-6">
            Orders by Status
          </h3>
          <div className="flex flex-wrap gap-4">
            {dashboard.ordersByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <span className="font-heading text-h3 text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          RECENT 10 ORDERS
          ============================================================ */}
      <div className="mt-8 border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h3 className="font-heading text-sm uppercase tracking-tight text-white">
            Recent Orders
          </h3>
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 text-body-sm text-brand-yellow
                       hover:underline"
          >
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-left">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Order
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Customer
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Status
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Total
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentOrders
                ? dashboard.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-body-sm text-brand-yellow font-mono">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-body-sm text-white">{order.user?.name ?? "Guest"}</p>
                          <p className="text-caption text-[#666]">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-body-sm text-white font-mono">
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-[#666]">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a]">
                      <td className="px-6 py-4"><div className="h-4 w-20 skeleton" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 skeleton" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 skeleton" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 skeleton" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 skeleton" /></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
