import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve the project's operational contract when starting the dev server.
  agentRules: false,
};

export default nextConfig;
