import path from "node:path";
import type { NextConfig } from "next";

// Next reads .env from the app directory; this repo keeps one at the root.
// Mirrors apps/api/src/main.ts. Absent under Compose, which sets real
// environment variables instead.
try {
    process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch {
    // No root .env — rely on the environment.
}

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
