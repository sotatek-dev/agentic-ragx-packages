import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sota-agentic-ragx/agentic-core-react"],
  serverExternalPackages: ["sql.js"],
};

export default nextConfig;
