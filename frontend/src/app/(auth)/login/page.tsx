"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧱</div>
          <h1 className="text-3xl font-extrabold text-white">Padme</h1>
          <p className="text-white/80 mt-1">Learn Databricks, one quiz at a time.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
