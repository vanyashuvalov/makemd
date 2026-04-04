/**
 * File: src/features/document-actions/model/pdf-browser.ts
 * Purpose: Chromium launcher for the server-side PDF export pipeline.
 * Why it exists: the new export flow needs a real browser to print markdown into a selectable PDF instead of taking a canvas screenshot.
 * What it does: resolves a usable Chromium executable for local development or serverless deployments and launches Playwright against it.
 * Connected to: the PDF export route and the document actions helper that downloads the generated PDF.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium as playwrightChromium, type Browser, type LaunchOptions } from 'playwright-core'
import chromium from '@sparticuz/chromium'

const CHROMIUM_EXECUTABLE_ENV_KEYS = [
  'PDF_BROWSER_EXECUTABLE_PATH',
  'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',
  'CHROME_EXECUTABLE_PATH',
  'PUPPETEER_EXECUTABLE_PATH',
]

// Check common local browser locations so the route can work on a developer machine without requiring a bespoke environment variable.
function findLocalChromiumExecutablePath() {
  for (const envKey of CHROMIUM_EXECUTABLE_ENV_KEYS) {
    const candidate = process.env[envKey]

    if (candidate && existsSync(candidate)) {
      return candidate
    }
  }

  if (process.platform === 'win32') {
    const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files'
    const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
    const localAppData = process.env.LOCALAPPDATA ?? ''

    const windowsCandidates = [
      join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ]

    return windowsCandidates.find((candidate) => existsSync(candidate))
  }

  if (process.platform === 'darwin') {
    const macCandidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]

    return macCandidates.find((candidate) => existsSync(candidate))
  }

  const linuxCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]

  return linuxCandidates.find((candidate) => existsSync(candidate))
}

// Resolve the launch configuration for the current environment so the PDF route can print with the same browser API in local development and serverless deployments.
async function resolvePdfBrowserLaunchOptions(): Promise<LaunchOptions> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

  if (isServerless) {
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }
  }

  const executablePath = findLocalChromiumExecutablePath()

  if (!executablePath) {
    throw new Error(
      'No Chromium executable was found. Set PDF_BROWSER_EXECUTABLE_PATH or install Google Chrome for local PDF export.'
    )
  }

  return {
    executablePath,
    headless: true,
  }
}

// Launch a short-lived browser instance for PDF generation so the route can render markdown with actual print layout semantics.
export async function launchPdfBrowser(): Promise<Browser> {
  const launchOptions = await resolvePdfBrowserLaunchOptions()
  return playwrightChromium.launch(launchOptions)
}
