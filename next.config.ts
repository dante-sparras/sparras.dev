import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  // Phone / LAN hostname is not 0.0.0.0, so the dev server must
  // allow it or Safari hangs on blocked /_next and HMR requests.
  allowedDevOrigins: ["192.168.1.3"],
  // Turbopack (next dev / next build) and webpack coexist; Next only
  // reads the matching block for the bundler in use.
  turbopack: {
    rules: {
      "*.wgsl": [
        {
          condition: "production",
          loaders: [
            {
              loader: "@vgpu/wgsl/loader-webpack",
              options: { minify: true },
            },
          ],
          as: "*.js",
        },
        {
          condition: "development",
          loaders: ["@vgpu/wgsl/loader-webpack"],
          as: "*.js",
        },
      ],
    },
  },
  webpack(config, { dev }) {
    config.module ??= {};
    config.module.rules ??= [];
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: "@vgpu/wgsl/loader-webpack",
      options: { minify: !dev },
    });
    return config;
  },
};

export default nextConfig;
