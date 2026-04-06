import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root so Turbopack doesn't pick a parent folder's lockfile (e.g. ~/package-lock.json).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
