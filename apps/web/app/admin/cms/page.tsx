// =============================================================================
// WERA — Admin CMS
// Section 7.6: Banners, announcement bar, blog management
// =============================================================================

"use client";

import { useState } from "react";
import { Image as ImageIcon, Type, FileText, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

type Tab = "banners" | "announcement" | "blog";

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<Tab>("banners");
  const utils = trpc.useUtils();

  const { data: banners } = trpc.admin.bannersList.useQuery();
  const { data: blogs } = trpc.admin.blogList.useQuery();

  const deleteBanner = trpc.admin.deleteBanner.useMutation({
    onSuccess: () => utils.admin.bannersList.invalidate(),
  });

  const deleteBlog = trpc.admin.deleteBlogPost.useMutation({
    onSuccess: () => utils.admin.blogList.invalidate(),
  });

  return (
    <div>
      <h1 className="font-heading text-h1 uppercase tracking-tight text-white mb-8">CMS</h1>

      {/* Tabs */}
      <div className="flex border-b border-[#222] mb-8">
        {([
          { key: "banners" as const, label: "Banners", icon: ImageIcon },
          { key: "announcement" as const, label: "Announcement Bar", icon: Type },
          { key: "blog" as const, label: "Blog", icon: FileText },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm transition-colors
                       border-b-2 -mb-[2px] ${
                         activeTab === tab.key
                           ? "border-brand-yellow text-brand-yellow"
                           : "border-transparent text-[#666] hover:text-white"
                       }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners tab */}
      {activeTab === "banners" && (
        <div>
          <div className="flex justify-between mb-6">
            <p className="text-body-sm text-[#666]">{banners?.length ?? 0} banners</p>
            <button className="btn-primary py-2.5 text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {banners?.map((banner) => (
              <div key={banner.id} className="border border-[#222] overflow-hidden
                                            hover:border-[#333] transition-colors">
                <div className="h-40 bg-[#1a1a1a] relative">
                  {banner.image && (
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 right-3">
                    {banner.isActive ? (
                      <span className="badge text-[8px]">Live</span>
                    ) : (
                      <span className="badge bg-[#333] text-[#666] text-[8px]">Draft</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-sm uppercase tracking-tight text-white mb-1">
                    {banner.title}
                  </h3>
                  {banner.ctaText && (
                    <p className="text-body-sm text-[#666] mb-3">{banner.ctaText}</p>
                  )}
                  <div className="flex gap-2">
                    <button className="p-2 text-[#666] hover:text-brand-yellow transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Delete?")) deleteBanner.mutate({ id: banner.id }); }}
                            className="p-2 text-[#666] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcement tab */}
      {activeTab === "announcement" && (
        <div className="max-w-lg space-y-6">
          <div>
            <label className="font-heading text-label uppercase text-[#999] mb-2 block">
              Announcement Text
            </label>
            <input type="text" placeholder="🔥 FREE SHIPPING ON ORDERS ABOVE ₹999"
                   className="w-full bg-transparent border border-[#333] px-5 py-3.5
                   text-white placeholder:text-[#555] focus:outline-none focus:border-brand-yellow" />
          </div>
          <div>
            <label className="font-heading text-label uppercase text-[#999] mb-2 block">
              Background Colour
            </label>
            <div className="flex gap-3">
              {["#FFE600", "#111111", "#e53935", "#1e88e5", "#2e7d32"].map((color) => (
                <button key={color}
                        className="w-10 h-10 border-2 border-[#333] hover:border-brand-yellow transition-colors"
                        style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-5 h-5 border-2 border-brand-yellow bg-brand-yellow flex items-center justify-center">
                <span className="text-brand-black text-xs">✓</span>
              </div>
              <span className="text-body-sm text-[#999]">Show announcement bar</span>
            </label>
          </div>
          <button className="btn-primary">Save Announcement</button>
        </div>
      )}

      {/* Blog tab */}
      {activeTab === "blog" && (
        <div>
          <div className="flex justify-between mb-6">
            <p className="text-body-sm text-[#666]">{blogs?.length ?? 0} posts</p>
            <button className="btn-primary py-2.5 text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Title</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#666]">Date</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {blogs?.map((post) => {
                  const data = post.value as any;
                  return (
                  <tr key={post.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-white">{data?.title}</p>
                      <p className="text-caption text-[#555] font-mono">{data?.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase
                                       tracking-wider border ${
                                         data?.isPublished
                                           ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                           : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                       }`}>
                        {data?.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-[#666]">
                      {data?.publishedAt ? new Date(data.publishedAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 text-[#666] hover:text-brand-yellow transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("Delete?")) deleteBlog.mutate({ id: post.id }); }}
                                className="p-1.5 text-[#666] hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
