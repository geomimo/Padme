import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Padme — Learn Databricks",
  description: "Master Databricks with daily quizzes, streaks, and XP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
