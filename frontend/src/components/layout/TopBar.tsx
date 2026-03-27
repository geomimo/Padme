"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

export function TopBar({ user }: { user: User }) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🧱</span>
        <span className="font-extrabold text-gray-900">Padme</span>
      </div>
      <div className="flex items-center gap-3 text-sm font-bold">
        <span className="text-orange-500">🔥 {user.streak}</span>
        <span className="text-yellow-600">⭐ {user.xp}</span>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="text-gray-400 hover:text-gray-600"
        >
          🚪
        </button>
      </div>
    </header>
  );
}
