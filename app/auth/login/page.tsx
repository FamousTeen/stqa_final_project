// app/register/page.tsx
import React, { Suspense } from "react";
import LoginForm from "@/app/components/LoginForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#030521] to-[#071034] py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
