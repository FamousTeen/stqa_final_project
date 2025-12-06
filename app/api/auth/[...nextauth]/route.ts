// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// NextAuth expects a default export of a handler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // If environment is misconfigured, NextAuth would fail — but throw early
  console.warn("Supabase env vars missing for NextAuth");
}

if (!supabaseServiceRole) {
  console.warn(
    "Missing SUPABASE_SERVICE_ROLE_KEY — required to read profiles server-side"
  );
}

const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          return null;
        }

        const user = data.user;

        // Use service role client to read `profiles` securely (server-side only).
        // This reads the role you store in profiles.id = auth.users.id
        let role = "user";
        if (supabaseServiceRole) {
          try {
            const supabaseAdmin = createClient(
              supabaseUrl,
              supabaseServiceRole
            );
            const { data: profile, error: profileErr } = await supabaseAdmin
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();

            if (!profileErr && profile?.role) {
              role = profile.role;
            }
          } catch (err) {
            // fallback to default 'user'
            console.error("Failed to fetch profile role:", err);
          }
        }

        // Return user object that will be attached to JWT via callbacks.jwt
        return {
          id: user.id,
          email: user.email,
          name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            undefined,
          role,
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login", // optional: custom sign-in page
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // on sign-in, `user` will be defined
      if (user) {
        token.user = user;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach the user object to the session (client will see session.user)
      if (token.user) session.user = token.user;
      session.supabaseAccessToken = token.accessToken;
      session.supabaseRefreshToken = token.refreshToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // gunakan callbackUrl jika dikirim dari signOut/signIn
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };
