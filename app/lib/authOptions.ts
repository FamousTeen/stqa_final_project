import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const authOptions: NextAuthOptions = {
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
              .select("role, is_active")
              .eq("id", user.id)
              .single();

            if (!profileErr && profile) {
              if (profile.is_active === false) {
                // User is disabled
                throw new Error("Your Account is disabled");
              }
              if (profile.role) {
                role = profile.role;
              }
            }
          } catch (err) {
            // If the error is the one we threw, rethrow it
            if (err instanceof Error && err.message === "Your Account is disabled") {
                throw err;
            }
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

      // Check if user is active (on every JWT check)
      if (token.user?.id && supabaseServiceRole) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("is_active")
          .eq("id", token.user.id)
          .single();

        if (!error && data && data.is_active === false) {
          // User is disabled, invalidate token
          // Returning an empty object or throwing error will cause session to be invalid/empty
          return {}; 
        }
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
