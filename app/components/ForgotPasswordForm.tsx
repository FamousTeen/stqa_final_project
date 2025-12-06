// components/ForgotPasswordForm.tsx
"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }

    setLoading(true);
    try {
      // optional: add redirectTo param to send user back to your app after password reset
      // e.g. const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-complete`;
      const redirectTo = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL ?? undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        setMessage({ type: "error", text: error.message || "Failed to send reset email." });
        setLoading(false);
        return;
      }

      setMessage({
        type: "success",
        text: "Check your email for password reset instructions. The link may take a few minutes to arrive (and check spam).",
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage({ type: "error", text: "Unexpected error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <h1 className="text-3xl font-bold text-center text-indigo-300 mb-8">Reset your password</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className="text-indigo-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            required
            autoComplete="email"
            aria-describedby="email-help"
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <a href="/login" className="text-sm text-indigo-300 hover:text-indigo-400 transition underline">Back to login</a>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </div>

        {message && (
          <div
            role="status"
            className={`mt-4 p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}
          >
            {message.text}
          </div>
        )}
      </form>

      <p id="email-help" className="mt-4 text-xs text-gray-400">
        We&apos;ll email you a link to reset your password.
      </p>
    </div>
  );
}
