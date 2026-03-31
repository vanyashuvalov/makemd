/**
 * File: next.config.ts
 * Purpose: Minimal Next.js configuration for the makemd prototype.
 * Why it exists: the project needs a typed config entrypoint even before production features are added.
 * What it does: keeps the app on the App Router defaults and leaves room for future Next-specific tuning.
 * Connected to: `src/app`, the build pipeline, and any future route- or image-level configuration.
 */
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default nextConfig
