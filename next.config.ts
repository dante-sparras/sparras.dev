import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // three + R3F WebGPU (`@/components/three`) + feature scenes
  transpilePackages: ["three"],
};

export default nextConfig;
