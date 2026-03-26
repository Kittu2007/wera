// =============================================================================
// WERA — Admin Product Management
// Section 7.2: Product list, status toggle, bulk ops, MF sync, CSV export
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Plus, RefreshCw, Download, MoreHorizontal, Eye, Edit,
  Trash2, Archive, CheckCircle, Package, Filter, ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function ProductStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    DRAFT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    ARCHIVED: "bg-[#222] text-[#666] border-[#333]",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold
                     uppercase tracking-wider border ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.productsList.useQuery({
    page,
    limit: 20,
    query: query || undefined,
    status: statusFilter as any,
  });

  const syncMutation = trpc.admin.syncProducts.useMutation({
    onSuccess: () => utils.admin.productsList.invalidate(),
  });

  const deleteMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => utils.admin.productsList.invalidate(),
  });

  const bulkStatusMutation = trpc.admin.bulkUpdateProductStatus.useMutation({
    onSuccess: () => {
      utils.admin.productsList.invalidate();
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
    },
  });

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.items) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((p) => p.id)));
    }
  };

  // CSV export
  const handleExport = () => {
    if (!data?.items) return;
    const header = "ID,Title,Status,Variants,Sales,Featured,Created\n";
    const rows = data.items.map((p) =>
      `${p.id},"${p.title}",${p.status},${p._count.variants},${p.salesCount},${p.isFeatured},${p.createdAt}`
    ).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wera-products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-h1 uppercase tracking-tight text-white">
            Products
          </h1>
          <p className="text-body-sm text-[#666] mt-1">
            {data?.total ?? 0} total products
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#333]
                       text-body-sm text-[#999] hover:border-brand-yellow
                       hover:text-brand-yellow transition-colors
                       disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync MF
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5
                 border border-[#333] text-body-sm text-[#999]
                 hover:border-brand-yellow hover:text-brand-yellow transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <Link href="/admin/products/new" className="btn-primary py-2.5 text-xs">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 max-w-md flex items-center border border-[#333] bg-[#0d0d0d]">
          <Search className="w-4 h-4 ml-4 text-[#666]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(searchInput)}
            placeholder="Search by title or slug..."
            className="flex-1 bg-transparent px-3 py-2.5 text-body-sm text-white
                       placeholder:text-[#555] focus:outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter ?? ""}
            onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }}
            className="appearance-none bg-[#0d0d0d] border border-[#333] px-4 py-2.5 pr-10
                       text-body-sm text-white cursor-pointer focus:outline-none
                       focus:border-brand-yellow"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                 text-[#666] pointer-events-none" />
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="relative">
            <button
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow text-brand-black
                         text-body-sm font-bold"
            >
              {selectedIds.size} selected <ChevronDown className="w-3 h-3" />
            </button>
            {bulkMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-[#333]
                             py-1 w-48 z-10 animate-fade-in">
                <button
                  onClick={() => bulkStatusMutation.mutate({
                    ids: [...selectedIds],
                    status: "ACTIVE",
                  })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                             text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Publish
                </button>
                <button
                  onClick={() => bulkStatusMutation.mutate({
                    ids: [...selectedIds],
                    status: "ARCHIVED",
                  })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                             text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
                <button
                  onClick={() => bulkStatusMutation.mutate({
                    ids: [...selectedIds],
                    status: "DRAFT",
                  })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm
                             text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                >
                  <Package className="w-4 h-4" /> Set Draft
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-6 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={data?.items ? selectedIds.size === data.items.length && data.items.length > 0 : false}
                    onChange={toggleSelectAll}
                    className="accent-brand-yellow"
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Updated
                </th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 w-20 skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="accent-brand-yellow"
                          aria-label={`Select ${product.title}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-body-sm text-white font-medium">{product.title}</p>
                          <p className="text-caption text-[#555] font-mono">{product.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ProductStatus status={product.status} />
                      </td>
                      <td className="px-6 py-4 text-body-sm text-[#999]">
                        {product._count.variants}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-[#999]">
                        {product._count.reviews}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-white font-mono">
                        {product.salesCount}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-[#666]">
                        {new Date(product.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuId(
                              actionMenuId === product.id ? null : product.id
                            )}
                            className="p-1.5 text-[#666] hover:text-white transition-colors"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {actionMenuId === product.id && (
                            <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a]
                                           border border-[#333] py-1 w-40 z-10 animate-fade-in">
                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                className="flex items-center gap-3 w-full px-4 py-2 text-body-sm
                                           text-[#999] hover:text-white hover:bg-[#222]"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Link>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="flex items-center gap-3 w-full px-4 py-2 text-body-sm
                                           text-[#999] hover:text-white hover:bg-[#222]"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${product.title}"?`)) {
                                    deleteMutation.mutate({ id: product.id });
                                  }
                                  setActionMenuId(null);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-body-sm
                                           text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a]">
            <p className="text-body-sm text-[#666]">
              Page {data.page} of {data.totalPages} ({data.total} products)
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
