import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  // Phone / LAN hostname is not 0.0.0.0, so the dev server must
  // allow it or Safari hangs on blocked /_next and HMR requests.
  allowedDevOrigins: ["192.168.1.3"],
};

export default nextConfig;
