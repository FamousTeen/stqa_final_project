import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Increase body size limit for Server Actions (file uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow up to 10MB file uploads
    },
  },
};

export default nextConfig;
