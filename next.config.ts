import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath: isGithubPages ? "/Meeting-booking-system" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
