// =============================================================================
// WERA — Admin Analytics
// Section 7.7: Revenue, orders, top products, AOV, coupon performance
// =============================================================================

"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, ShoppingCart, Tag, ArrowUp, ArrowDown } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: trend } = trpc.admin.revenueTrend.useQuery({ days });
  const { data: topProducts } = trpc.admin.topProducts.useQuery({ limit: 10 });

  // Compute summary from trend data
  const totalRevenue = trend?.reduce((sum, d) => sum + Number(d.revenue), 0) ?? 0;
  const totalOrders = trend?.reduce((sum, d) => sum + d.orders, 0) ?? 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const maxRevenue = trend ? Math.max(...trend.map((d) => Number(d.revenue))) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-h1 uppercase tracking-tight text-white">Analytics</h1>
        <div className="flex border border-[#222]">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                      days === d ? "bg-brand-yellow text-brand-black" : "text-[#666] hover:text-white"
                    }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-brand-yellow" />
            <span className="text-body-sm text-[#666]">Revenue ({days}d)</span>
          </div>
          <p className="font-heading text-h1 text-white">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span className="text-body-sm text-[#666]">Orders ({days}d)</span>
          </div>
          <p className="font-heading text-h1 text-white">{totalOrders}</p>
        </div>
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-body-sm text-[#666]">AOV ({days}d)</span>
          </div>
          <p className="font-heading text-h1 text-white">₹{aov.toFixed(0)}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 mb-8">
        <h3 className="font-heading text-sm uppercase tracking-tight text-white mb-6">
          Revenue Over Time
        </h3>
        <div className="h-[300px] flex items-end gap-1">
          {trend?.map((day, i) => {
            const height = maxRevenue > 0 ? (Number(day.revenue) / maxRevenue) * 100 : 0;
            return (
              <div key={i} className="flex-1 group relative">
                <div className="bg-brand-yellow/30 hover:bg-brand-yellow/60 transition-colors"
                     style={{ height: `${Math.max(height, 2)}%` }} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                               hidden group-hover:block z-10">
                  <div className="bg-[#222] px-3 py-1.5 text-[10px] text-white
                                 whitespace-nowrap border border-[#333]">
                    ₹{Number(day.revenue).toLocaleString("en-IN")}
                    <br /><span className="text-[#666]">{day.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {trend && (
          <div className="flex justify-between mt-3 text-[10px] text-[#555]">
            <span>{trend[0]?.date}</span>
            <span>{trend[trend.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* Top products table */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h3 className="font-heading text-sm uppercase tracking-tight text-white">
            Top Products by Revenue
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">#</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Product</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Units Sold</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {topProducts?.map((product, i) => (
              <tr key={product.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                <td className="px-6 py-4 font-heading text-h3 text-[#333]">{i + 1}</td>
                <td className="px-6 py-4">
                  <p className="text-body-sm text-white">{product.title}</p>
                </td>
                <td className="px-6 py-4 text-body-sm text-brand-yellow font-mono">
                  {product.salesCount}
                </td>
                <td className="px-6 py-4 text-body-sm text-[#999]">
                  {product.avgRating > 0 ? `${product.avgRating.toFixed(1)} ★` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
