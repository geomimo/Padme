"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 p-6 text-white">
      <div className="max-w-2xl text-center space-y-6">
        <div className="text-7xl">🧱</div>
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">
          Learn Databricks
        </h1>
        <p className="text-xl opacity-90">
          Master Delta Lake, Apache Spark, MLflow, and more through daily
          bite-sized quizzes. Build streaks. Earn XP. Level up.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 shadow-[0_4px_0_rgba(0,0,0,0.2)]">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 text-sm">
          {[
            { icon: "🔥", label: "Daily Streaks" },
            { icon: "⭐", label: "XP System" },
            { icon: "📚", label: "8 Topics" },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-3xl">{icon}</div>
              <div className="font-semibold mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
