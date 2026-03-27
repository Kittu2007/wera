// =============================================================================
// WERA — Admin Reviews Moderation
// Section 6.7: Moderation queue, approve/reject
// =============================================================================

"use client";

import { useState } from "react";
import { Star, Check, X, Eye, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data: reviews, isLoading } = trpc.admin.reviewsList.useQuery({
    status: tab === "all" ? undefined : tab === "pending" ? "PENDING" : "APPROVED",
    page,
    limit: 10,
  });

  const approveMutation = trpc.admin.approveReview.useMutation({
    onSuccess: () => utils.admin.reviewsList.invalidate(),
  });

  const rejectMutation = trpc.admin.rejectReview.useMutation({
    onSuccess: () => utils.admin.reviewsList.invalidate(),
  });

  return (
    <div>
      <h1 className="font-heading text-h1 uppercase tracking-tight text-white mb-8">Reviews</h1>

      {/* Tabs */}
      <div className="flex border-b border-[#222] mb-8">
        {([
          { key: "pending" as const, label: "Pending" },
          { key: "approved" as const, label: "Approved" },
          { key: "all" as const, label: "All" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm transition-colors border-b-2 -mb-[2px] ${
              tab === t.key
                ? "border-brand-yellow text-brand-yellow"
                : "border-transparent text-[#666] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
      ) : reviews && reviews.items.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-4">
            {reviews.items.map((review) => (
              <div key={review.id} className="border border-[#222] p-6 hover:border-[#333] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Stars */}
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "text-brand-yellow fill-brand-yellow"
                                  : "text-[#333]"
                              }`} />
                      ))}
                    </div>

                    {/* Title + body */}
                    {review.title && (
                      <h3 className="font-heading text-sm uppercase tracking-tight text-white mb-1">
                        {review.title}
                      </h3>
                    )}
                    <p className="text-body-sm text-[#ccc] mb-3">{review.body}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-caption text-[#666]">
                      <span>by {review.user?.name ?? review.user?.email ?? "Anonymous"}</span>
                      <span>on {review.product?.title}</span>
                      <span>{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                      {review.verified && (
                        <span className="badge text-[8px] py-0.5">Verified Purchase</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {review.status === "PENDING" && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => approveMutation.mutate({ id: review.id })}
                        className="p-2.5 border border-emerald-500/30 text-emerald-400
                                   hover:bg-emerald-500/10 transition-colors"
                        aria-label="Approve review"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate({ id: review.id })}
                        className="p-2.5 border border-red-500/30 text-red-400
                                   hover:bg-red-500/10 transition-colors"
                        aria-label="Reject review"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {reviews.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[#333] text-xs text-[#999] hover:text-white disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= reviews.totalPages}
                className="px-4 py-2 border border-[#333] text-xs text-[#999] hover:text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center border border-[#1a1a1a]">
          <MessageSquare className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="font-heading text-h3 uppercase tracking-tight text-[#555]">
            {tab === "pending" ? "No pending reviews" : "No reviews found"}
          </p>
        </div>
      )}
    </div>
  );
}
