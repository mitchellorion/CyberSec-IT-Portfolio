import type { NextConfig } from "next";

const repoName = "CyberSec-IT-Portfolio";
const useBasePath = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: useBasePath ? `/${repoName}` : "",
  assetPrefix: useBasePath ? `/${repoName}/` : "",
  images: { unoptimized: true },
};

export default nextConfig;
