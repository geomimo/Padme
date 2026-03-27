"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} />
        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
