import React from "react";
import ForgotPasswordForm from "../../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white flex items-center">
      <div className="w-full max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#08102a]/60 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/10">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}