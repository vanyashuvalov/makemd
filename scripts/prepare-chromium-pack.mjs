/**
 * File: scripts/prepare-chromium-pack.mjs
 * Purpose: Build-time Chromium pack downloader for the PDF export pipeline.
 * Why it exists: the serverless PDF route now points to a pack hosted by this deployment, so the browser bundle can be fetched from Vercel instead of GitHub on every cold start.
 * What it does: downloads the Chromium Brotli pack into `public/chromium-pack.tar` if it is missing and keeps the version aligned with the installed `@sparticuz/chromium-min` dependency.
 * Connected to: `src/features/document-actions/model/pdf-browser.ts`, which resolves the pack URL at runtime and points Chromium at the hosted tarball.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const ROOT_DIR = process.cwd()
const OUTPUT_FILE = join(ROOT_DIR, 'public', 'chromium-pack.tar')
const LOCK_FILE = join(ROOT_DIR, 'package-lock.json')

// Read the installed Chromium pack version from the lockfile so build-time and runtime always target the same tarball without duplicating version strings.
function resolveChromiumPackVersion() {
  const lockfile = JSON.parse(readFileSync(LOCK_FILE, 'utf8'))
  const packageVersion = lockfile.packages?.['node_modules/@sparticuz/chromium-min']?.version

  if (typeof packageVersion === 'string' && packageVersion.trim()) {
    return packageVersion.trim()
  }

  const fallbackVersion = process.env.PDF_CHROMIUM_PACK_VERSION

  if (typeof fallbackVersion === 'string' && fallbackVersion.trim()) {
    return fallbackVersion.trim()
  }

  throw new Error('Unable to resolve the Chromium pack version from package-lock.json.')
}

// Build the release asset URL that contains the Brotli pack for the current architecture so the deployment can host the tarball locally.
function resolveChromiumPackUrl(version) {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return `https://github.com/Sparticuz/chromium/releases/download/v${version}/chromium-v${version}-pack.${arch}.tar`
}

// Download the tarball only when it is missing so local and CI builds avoid paying the transfer cost more than once per workspace state.
async function main() {
  if (existsSync(OUTPUT_FILE)) {
    console.log(`[chromium-pack] already present at ${OUTPUT_FILE}`)
    return
  }

  const version = resolveChromiumPackVersion()
  const sourceUrl = resolveChromiumPackUrl(version)
  const outputDirectory = dirname(OUTPUT_FILE)

  mkdirSync(outputDirectory, { recursive: true })

  console.log(`[chromium-pack] downloading ${sourceUrl}`)
  const response = await fetch(sourceUrl)

  if (!response.ok || !response.body) {
    throw new Error(`[chromium-pack] failed to download pack: ${response.status} ${response.statusText}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(OUTPUT_FILE))
  console.log(`[chromium-pack] wrote ${OUTPUT_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
