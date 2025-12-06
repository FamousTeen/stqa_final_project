// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // On landing, Supabase sets the user's session automatically
    // if the link is valid. No need for extra token parsing.
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Password updated successfully! Redirecting to login...",
    });

    setTimeout(() => router.push("/auth/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white px-6">
      <div className="bg-[#0D1B3C]/70 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/10 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-indigo-300 mb-8 text-center">Set a New Password</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-indigo-300">New Password</label>
            <input
              type="password"
              className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="text-indigo-300">Confirm Password</label>
            <input
              type="password"
              className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {message && (
            <p
              className={`mt-4 p-3 rounded-md text-sm ${
                message.type === "success" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
              }`}
            >
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
