/**
 * File: scripts/prepare-chromium-pack.mjs
 * Purpose: Build-time Chromium pack downloader for the PDF export pipeline.
 * Why it exists: the serverless PDF route needs a local Brotli directory so Chromium can inflate its binary without fetching the pack over the network on every cold start.
 * What it does: downloads the Chromium Brotli pack, extracts it into `public/chromium-pack`, and keeps the version aligned with the installed `@sparticuz/chromium-min` dependency.
 * Connected to: `src/features/document-actions/model/pdf-browser.ts`, which resolves the pack directory at runtime and points Chromium at the extracted Brotli files.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const ROOT_DIR = process.cwd()
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'chromium-pack')
const TEMP_ARCHIVE_FILE = join(ROOT_DIR, '.tmp', 'chromium-pack.tar')
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
  if (existsSync(join(OUTPUT_DIR, 'chromium.br'))) {
    console.log(`[chromium-pack] already present at ${OUTPUT_DIR}`)
    return
  }

  const version = resolveChromiumPackVersion()
  const sourceUrl = resolveChromiumPackUrl(version)
  const tempDirectory = dirname(TEMP_ARCHIVE_FILE)

  mkdirSync(tempDirectory, { recursive: true })
  mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log(`[chromium-pack] downloading ${sourceUrl}`)
  const response = await fetch(sourceUrl)

  if (!response.ok || !response.body) {
    throw new Error(`[chromium-pack] failed to download pack: ${response.status} ${response.statusText}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(TEMP_ARCHIVE_FILE))
  console.log(`[chromium-pack] extracting into ${OUTPUT_DIR}`)

  const extraction = spawnSync('tar', ['-xf', TEMP_ARCHIVE_FILE, '-C', OUTPUT_DIR], {
    stdio: 'inherit',
  })

  if (extraction.status !== 0) {
    throw new Error(`[chromium-pack] failed to extract pack archive with exit code ${extraction.status ?? 'unknown'}`)
  }

  rmSync(TEMP_ARCHIVE_FILE, { force: true })
  console.log(`[chromium-pack] wrote ${OUTPUT_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
