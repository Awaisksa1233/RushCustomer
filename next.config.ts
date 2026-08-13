import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/applepay/**/*": ["./certs/**/*"],
  },
};

export default nextConfig;
