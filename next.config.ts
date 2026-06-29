import type { NextConfig } from "next";

const repoName = "CyberSec-IT-Portfolio";
const useGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages; Cloudflare uses opennextjs full build
  ...(useGitHubPages && { output: "export" }),
  basePath: useGitHubPages ? `/${repoName}` : "",
  assetPrefix: useGitHubPages ? `/${repoName}/` : "",
  images: { unoptimized: true },
};

export default nextConfig;
