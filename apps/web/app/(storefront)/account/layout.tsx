// =============================================================================
// WERA — User Account Layout
// Section 6.6: Sidebar navigation for account pages
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Package, Heart, MapPin, User, Settings, LogOut, ChevronRight,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { destroyCookie } from "nookies";

const ACCOUNT_NAV = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email ?? "");
      setUserName(user.displayName || user.email?.split("@")[0] || "");
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      destroyCookie(null, "session", { path: "/" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="container section">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-heading text-display-xl uppercase tracking-tight">My Account</h1>
        <p className="text-body text-[#666] mt-2">{userEmail}</p>
      </div>

      <div className="grid lg:grid-cols-[240px,1fr] gap-10">
        {/* Sidebar */}
        <nav className="space-y-1" aria-label="Account navigation">
          {ACCOUNT_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
                           ${isActive
                             ? "bg-brand-yellow/10 text-brand-yellow border-l-2 border-brand-yellow"
                             : "text-[#999] hover:text-white hover:bg-[#111]"
                           }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#666]
                       hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </nav>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
