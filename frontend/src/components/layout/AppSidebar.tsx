"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/learn", icon: "📚", label: "Learn" },
  { href: "/paths", icon: "🗺️", label: "Paths" },
  { href: "/review", icon: "🔄", label: "Review" },
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/history", icon: "📅", label: "History" },
  { href: "/bookmarks", icon: "🔖", label: "Bookmarks" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r-2 border-gray-200 bg-white min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b-2 border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧱</span>
          <div>
            <div className="font-extrabold text-xl text-gray-900">Padme</div>
            <div className="text-xs text-gray-500">Learn Databricks</div>
          </div>
        </div>
      </div>

      {/* User stats */}
      <div className="p-4 border-b-2 border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-500 font-bold">🔥 {user.streak} day streak</span>
            {user.streak_freezes > 0 && (
              <span className="text-xs text-blue-500 font-semibold">❄️ ×{user.streak_freezes}</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-600 font-bold">⭐ {user.xp} XP</span>
          </div>
          <div className="text-xs text-gray-500 truncate">{user.name ?? user.email}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-green-500 text-white shadow-[0_2px_0_#16a34a]"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
        {user.role === "admin" && (
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <span className="text-base">⚙️</span>
            Admin Panel
          </a>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t-2 border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <span className="text-base">🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
