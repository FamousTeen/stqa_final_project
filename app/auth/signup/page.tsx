// app/register/page.tsx
import React from "react";
import SignUpForm from "@/app/components/SignUpForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#030521] to-[#071034] py-12">
      <SignUpForm />
    </div>
  );
}
