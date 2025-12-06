import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string
    supabaseRefreshToken?: string
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    user?: any
  }
}
