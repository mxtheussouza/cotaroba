import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve the project's operational contract when starting the dev server.
  agentRules: false,
  logging: {
    // Old bookmarked login URLs must not repeat credential query fields in dev logs.
    incomingRequests: { ignore: [/[?&](?:email|password)=/i] },
  },
};

export default nextConfig;
