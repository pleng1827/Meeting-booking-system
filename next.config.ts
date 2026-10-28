import type { NextConfig } from "next";

const isExport = process.env.EXPORT_STATIC === "true";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        basePath: "/Meeting-booking-system",
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
