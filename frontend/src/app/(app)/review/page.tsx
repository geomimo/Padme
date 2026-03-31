"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ReviewLandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await reviewApi.start();
      router.push(`/review/${session.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <div className="text-6xl">🔄</div>
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Mistake Review</h1>
        <p className="text-gray-500 mt-2">
          Practice the questions you&apos;ve gotten wrong. Reviewing mistakes is the fastest way to improve.
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-5 text-left space-y-2">
        <div className="font-bold text-blue-800">How it works</div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Up to 10 of your most recently missed questions</li>
          <li>• Answers update your spaced-repetition schedule</li>
          <li>• No XP awarded (pure practice mode)</li>
        </ul>
      </div>

      {error && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-orange-700 font-medium text-sm">
          {error}
        </div>
      )}

      <Button size="lg" className="w-full" onClick={handleStart} disabled={loading}>
        {loading ? "Loading..." : "Start Review Session"}
      </Button>
    </div>
  );
}
