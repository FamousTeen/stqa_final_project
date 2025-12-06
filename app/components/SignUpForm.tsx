// components/SignUpForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

type FormState = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string[] | string> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? { general: data.message ?? "Registration failed" });
        setLoading(false);
        return;
      }

      // Optional: auto-login after register using NextAuth credentials provider
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      // signIn returns an object or undefined; check for error
      if (signInResult?.error) {
        // If auto-login fails, redirect to login page
        router.push("/login");
        return;
      }

      // successful auto-login -> redirect to home
      router.push("/");
    } catch (err) {
      setErrors({ general: "Unexpected error: " + (err as Error).message });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <h1 className="text-3xl font-bold text-center text-indigo-300 mb-8">
        Create an Account
      </h1>

      <form onSubmit={handleSubmit}>
        {/* NAME */}
        <div className="mb-4">
          <label htmlFor="name" className="text-indigo-300">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            required
            autoFocus
            autoComplete="name"
          />
          {errors?.name && <p className="mt-2 text-red-400">{(errors.name as string) || JSON.stringify(errors.name)}</p>}
        </div>

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
          />
          {errors?.email && <p className="mt-2 text-red-400">{(errors.email as string) || JSON.stringify(errors.email)}</p>}
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label htmlFor="password" className="text-indigo-300">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            required
            autoComplete="new-password"
          />
          {errors?.password && <p className="mt-2 text-red-400">{(errors.password as string) || JSON.stringify(errors.password)}</p>}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="mb-4">
          <label htmlFor="password_confirmation" className="text-indigo-300">Confirm Password</label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={handleChange}
            className="block mt-1 w-full bg-[#0A1530]/60 border border-white/10 text-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
            required
            autoComplete="new-password"
          />
          {errors?.password_confirmation && <p className="mt-2 text-red-400">{(errors.password_confirmation as string) || JSON.stringify(errors.password_confirmation)}</p>}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between mt-6">
          <a href="/auth/login" className="text-sm text-indigo-300 hover:text-indigo-400 transition underline">
            Already registered?
          </a>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Register"}
          </button>
        </div>

        {errors?.general && <p className="mt-4 text-red-400">{errors.general}</p>}
      </form>
    </div>
  );
}
