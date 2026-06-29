import type { NextConfig } from "next";

const repoName = "CyberSec-IT-Portfolio";
const useGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // GitHub Pages: static export; Cloudflare/dev: standalone (required by opennextjs)
  output: useGitHubPages ? "export" : "standalone",
  basePath: useGitHubPages ? `/${repoName}` : "",
  assetPrefix: useGitHubPages ? `/${repoName}/` : "",
  images: { unoptimized: true },
};

export default nextConfig;
