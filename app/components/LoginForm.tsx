// components/LoginForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeClosed } from 'lucide-react';
import { signIn, type SignInResponse, useSession } from "next-auth/react";

type FormState = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string[] | string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: session, status } = useSession();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    // Basic client-side validation
    if (!form.email || !form.password) {
      setErrors({ general: "Please provide both email and password." });
      setLoading(false);
      return;
    }

    try {
      // Use next-auth credentials provider (redirect: false to handle errors)
      const result = (await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password, // optional; depends on your provider logic
      })) as SignInResponse | undefined;

      setLoading(false);

      // signIn may return undefined in some setups; handle common shapes
      // When redirect: false, result is typically { ok?: boolean, error?: string, status?: number }
      // Type is `unknown` from next-auth, so we check at runtime.
      const error = result?.error ?? (result?.ok === false ? "Login failed" : undefined);

      if (error) {
        setErrors({ general: typeof error === "string" ? error : "Login failed" });
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (!session?.user) {
        setErrors({ general: "Unable to load user session." });
        return;
      }

      // Role-based redirect
      if (session.user.role === "admin") {
        router.push("/admin");
      } else if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: "Unexpected error. Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <h1 className="text-3xl font-bold text-center text-indigo-300 mb-8">Sign in to your account</h1>

      <form onSubmit={handleSubmit} noValidate>
        {/* EMAIL */}
        <div className="mb-4">
          <label htmlFor="email" className="text-indigo-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            required
            autoComplete="username"
            aria-invalid={!!errors?.email}
            aria-describedby={errors?.email ? "email-error" : undefined}
          />
          {errors?.email && (
            <p id="email-error" className="mt-2 text-red-400">
              {(errors.email as string) || JSON.stringify(errors.email)}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="mb-4 relative">
          <label htmlFor="password" className="text-indigo-300">Password</label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 pr-10"
            required
            autoComplete="current-password"
            aria-invalid={!!errors?.password}
            aria-describedby={errors?.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-[38px] text-sm text-gray-300 select-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye /> : <EyeClosed />}
          </button>

          {errors?.password && (
            <p id="password-error" className="mt-2 text-red-400">
              {(errors.password as string) || JSON.stringify(errors.password)}
            </p>
          )}
        </div>

        {/* FORGOT PASSWORD */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/auth/forgot-pass" className="text-sm text-indigo-300 hover:text-indigo-400 underline">
            Forgot password?
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between mt-6">
          <Link href="/auth/signup" className="text-sm text-indigo-300 hover:text-indigo-400 transition underline">
            Create account
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        {errors?.general && <p className="mt-4 text-red-400">Invalid credentials. Please try again.</p>}
      </form>
    </div>
  );
}
