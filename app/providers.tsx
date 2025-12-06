// app/providers.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { supabase } from "./lib/supabaseClient";

function SupabaseSessionSync({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.supabaseAccessToken) {
      supabase.auth.setSession({
        access_token: session.supabaseAccessToken,
        refresh_token: session.supabaseRefreshToken || "",
      });
    }
  }, [session]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  // You can pass options to SessionProvider if needed, e.g. `refetchInterval`
  return (
    <SessionProvider>
      <SupabaseSessionSync>{children}</SupabaseSessionSync>
    </SessionProvider>
  );
}
