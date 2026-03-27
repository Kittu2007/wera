// =============================================================================
// WERA — Admin Dashboard Layout
// Sidebar navigation + admin route protection
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Image as ImageIcon, Settings, BarChart3, MessageSquare,
  LogOut, Menu, X, ChevronRight, Bell, ExternalLink,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { TRPCProvider } from "@/lib/trpc-provider";
import { destroyCookie } from "nookies";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/cms", label: "CMS", icon: ImageIcon },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Layout Component
// ---------------------------------------------------------------------------

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  // Check auth on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsAuthed(true);
      setAdminName(user.displayName || user.email?.split("@")[0] || "Admin");
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      destroyCookie(null, "session", { path: "/" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <TRPCProvider>
      <div className="min-h-screen bg-[#0a0a0a] flex">
        {/* ============================================================
            SIDEBAR
            ============================================================ */}
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:sticky top-0 h-screen w-64 bg-brand-black border-r border-[#1a1a1a]
                     flex flex-col z-50 transition-transform duration-300
                     ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#1a1a1a]">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="font-heading text-[24px] font-extrabold tracking-[-0.03em]
                             text-white leading-none">
                WERA
              </span>
              <span className="badge text-[8px] py-0.5">Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-[#666] hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Admin navigation">
            <ul className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                  || (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm
                                 transition-all duration-200 group
                                 ${isActive
                                   ? "bg-brand-yellow/10 text-brand-yellow border-l-2 border-brand-yellow"
                                   : "text-[#999] hover:text-white hover:bg-[#111]"
                                 }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? "text-brand-yellow" : ""}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-[#1a1a1a] space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#666]
                         hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Store
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#666]
                         hover:text-red-400 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ============================================================
            MAIN CONTENT
            ============================================================ */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="h-16 bg-brand-black border-b border-[#1a1a1a]
                            flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#999] hover:text-white"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-body-sm text-[#666]">
                <span>Admin</span>
                {pathname !== "/admin" && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white capitalize">
                      {pathname.split("/").pop()?.replace(/-/g, " ")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 text-[#666] hover:text-white relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-yellow" />
              </button>

              {/* Admin avatar */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-yellow/20 flex items-center justify-center">
                  <span className="text-brand-yellow text-xs font-bold uppercase">
                    {adminName[0]}
                  </span>
                </div>
                <span className="text-body-sm text-[#999] hidden md:block">{adminName}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </TRPCProvider>
  );
}
