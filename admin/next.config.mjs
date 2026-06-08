import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Admin is a self-contained app; nothing fancy needed.
  reactStrictMode: true,
  // Pin the workspace root to this folder. Without it, Next walks up and
  // picks a stray lockfile (e.g. in the home dir or the Expo project),
  // which warns in dev and broadens output file tracing on deploy.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
