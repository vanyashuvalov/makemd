<!--
File: docs/03-vercel.md
Purpose: Vercel deployment and project settings reference for makemd.
Why it exists: the app is ready for Vercel now, and the repo needs a compact source of truth for deployment defaults.
What it does: records the chosen Vercel framework preset, Node version, environment-variable posture, and the root analytics hook.
Connected to: `vercel.json`, `package.json`, `src/app/layout.tsx`, and the Vercel dashboard project settings.
-->

# Vercel settings for makemd

## 1. Current configuration

- Framework preset: `nextjs`
- Node.js version: `24.x`
- Build command: default `next build` from `package.json`
- Install command: default npm install from lockfile
- Root directory: repository root

## 2. Files added for Vercel

- [vercel.json](../vercel.json)
- [package.json](../package.json)
- [src/app/layout.tsx](../src/app/layout.tsx)
- [package-lock.json](../package-lock.json)

## 3. Why these settings

The project is a standard Next.js App Router application, so Vercel can auto-detect most behavior.
The explicit `vercel.json` framework preset removes ambiguity, and the Node engine pin keeps the runtime aligned with Vercel's current default LTS line.
Vercel Web Analytics is mounted in the root layout through `@vercel/analytics/next`, so visitor tracking now happens from the shared app shell instead of a page-specific wrapper.

## 4. Environment variables

At the moment the app does not consume any runtime environment variables.
A local Figma token exists in `.env`, but it is not used by the app code yet.
If future work adds real Figma API access in the browser or on the server, that token should be moved into Vercel project environment variables instead of being committed.

## 5. Dashboard settings to verify

- Project root points to the repo root.
- Node.js version matches `24.x` or the current Vercel default LTS line.
- Build command remains the default Next.js build unless a custom pipeline is introduced later.
- No extra output directory is set.

## 6. Notes for future changes

- If we add API routes, cron jobs, or image generation, update Vercel settings only where the new runtime requires it.
- If the deployment should use a non-default Node version, change it in one place first: `package.json` or the dashboard, not both.
- Web Analytics still needs to be enabled in the Vercel dashboard for the project before production traffic will appear in the Analytics tab.
