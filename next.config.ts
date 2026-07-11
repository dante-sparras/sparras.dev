import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // three/webgpu + addons used by the black hole island
  transpilePackages: ["three"],
};

export default nextConfig;
