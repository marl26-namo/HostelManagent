import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools badge renders a fixed 36x36 toast in the bottom-left corner,
  // where it covers the sidebar's Sign out button in the preview.
  devIndicators: false,
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
