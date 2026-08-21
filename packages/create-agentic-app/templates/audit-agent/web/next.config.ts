import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sotatek-dev/agentic-core-react"],
  serverExternalPackages: ["sql.js"],
};

export default nextConfig;
