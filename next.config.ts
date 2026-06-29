import type { NextConfig } from "next";

const repoName = "CyberSec-IT-Portfolio";
const useBasePath = process.env.GITHUB_PAGES === "true";
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  basePath: useBasePath ? `/${repoName}` : "",
  assetPrefix: useBasePath ? `/${repoName}/` : "",
  images: { unoptimized: true },
  // Proxy flip.gg API in dev to bypass CORS (output:export ignores rewrites at build time)
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: "/api/flip-proxy/:path*",
          destination: "https://api.flip.gg/api/:path*",
        },
      ];
    },
  }),
};

export default nextConfig;
