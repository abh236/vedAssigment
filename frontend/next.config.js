/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any HTTPS source (profile photos stored as base64 don't need this,
  // but useful if you later add external image URLs)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Expose env vars to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    NEXT_PUBLIC_WS_URL:  process.env.NEXT_PUBLIC_WS_URL  || "http://localhost:4000",
  },

  // Required for Vercel — disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;
