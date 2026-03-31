/**
 * File: eslint.config.mjs
 * Purpose: Flat ESLint configuration for the Next.js codebase.
 * Why it exists: the project needs a modern lint entrypoint that matches App Router tooling.
 * What it does: applies Next.js's core web vitals rules across the repo.
 * Connected to: all TypeScript and TSX files under `src/`.
 */
import nextVitals from 'eslint-config-next/core-web-vitals'

export default nextVitals
