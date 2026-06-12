import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow bcryptjs native module
  serverExternalPackages: [],
  // Ensure data directory is writable
  output: undefined,
};

export default nextConfig;
