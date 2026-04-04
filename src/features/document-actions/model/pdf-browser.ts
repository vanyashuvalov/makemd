/**
 * File: src/features/document-actions/model/pdf-browser.ts
 * Purpose: Chromium launcher for the server-side PDF export pipeline.
 * Why it exists: the new export flow needs a real browser to print markdown into a selectable PDF instead of taking a canvas screenshot.
 * What it does: resolves a usable Chromium executable for local development or serverless deployments and launches Playwright against it.
 * Connected to: the PDF export route and the document actions helper that downloads the generated PDF.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  chromium as playwrightChromium,
  type Browser,
  type BrowserContext,
  type LaunchOptions,
  type Page,
} from 'playwright-core'
import packageLock from '../../../../package-lock.json'
import chromium from '@sparticuz/chromium-min'

const CHROMIUM_EXECUTABLE_ENV_KEYS = [
  'PDF_BROWSER_EXECUTABLE_PATH',
  'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',
  'CHROME_EXECUTABLE_PATH',
  'PUPPETEER_EXECUTABLE_PATH',
]
const CHROMIUM_PACK_VERSION =
  packageLock.packages?.['node_modules/@sparticuz/chromium-min']?.version ??
  process.env.PDF_CHROMIUM_PACK_VERSION ??
  '143.0.4'
let cachedBrowser: Browser | null = null
let cachedBrowserPromise: Promise<Browser> | null = null
type PdfBrowserSession = {
  browser: Browser
  context: BrowserContext
  page: Page
}
let cachedPdfBrowserSession: PdfBrowserSession | null = null
let cachedPdfBrowserSessionPromise: Promise<PdfBrowserSession> | null = null
let pdfTaskQueue: Promise<void> = Promise.resolve()

// Build the remote Brotli pack URL from the package version so serverless deployments can download the exact matching Chromium bundle without depending on a local node_modules bin directory.
function resolveChromiumPackUrl() {
  const configuredPackUrl = process.env.PDF_CHROMIUM_PACK_URL

  if (configuredPackUrl) {
    return configuredPackUrl
  }

  const localPackDirectory = join(process.cwd(), 'public', 'chromium-pack')

  if (existsSync(localPackDirectory)) {
    return localPackDirectory
  }

  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_PACK_VERSION}/chromium-v${CHROMIUM_PACK_VERSION}-pack.${arch}.tar`
}

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
      executablePath: await chromium.executablePath(resolveChromiumPackUrl()),
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

// Launch a browser instance for PDF generation and keep it warm across serverless invocations so repeated exports avoid paying the Chromium startup cost on every request.
async function createPdfBrowser(): Promise<Browser> {
  const launchOptions = await resolvePdfBrowserLaunchOptions()
  return playwrightChromium.launch(launchOptions)
}

// Return the shared browser instance, relaunching it only when the previous process has disconnected so PDF exports can reuse the expensive Chromium startup work.
async function getPdfBrowser(): Promise<Browser> {
  if (cachedBrowser?.isConnected()) {
    return cachedBrowser
  }

  if (!cachedBrowserPromise) {
    cachedBrowserPromise = createPdfBrowser()
      .then((browser) => {
        cachedBrowser = browser
        return browser
      })
      .catch((error) => {
        cachedBrowser = null
        cachedBrowserPromise = null
        throw error
      })
  }

  const browser = await cachedBrowserPromise

  if (!browser.isConnected()) {
    cachedBrowser = null
    cachedBrowserPromise = null
    return getPdfBrowser()
  }

  return browser
}

// Create or reuse a single browser context and page so repeated PDF exports on the same warm function avoid paying the page/bootstrap cost every time.
async function getPdfBrowserSession(): Promise<PdfBrowserSession> {
  if (cachedPdfBrowserSession?.browser.isConnected() && cachedPdfBrowserSession.page.isClosed() === false) {
    return cachedPdfBrowserSession
  }

  if (!cachedPdfBrowserSessionPromise) {
    cachedPdfBrowserSessionPromise = (async () => {
      const browser = await getPdfBrowser()
      const context = await browser.newContext()
      const page = await context.newPage()
      const session = { browser, context, page }

      cachedPdfBrowserSession = session
      return session
    })().catch((error) => {
      cachedPdfBrowserSession = null
      cachedPdfBrowserSessionPromise = null
      throw error
    })
  }

  const session = await cachedPdfBrowserSessionPromise

  if (session.browser.isConnected() && session.page.isClosed() === false) {
    return session
  }

  cachedPdfBrowserSession = null
  cachedPdfBrowserSessionPromise = null
  return getPdfBrowserSession()
}

// Run the export work serially so a reused page is never touched by two requests at the same time.
export async function runPdfTask<T>(task: (session: PdfBrowserSession) => Promise<T>): Promise<T> {
  const nextTask = pdfTaskQueue.then(async () => {
    const session = await getPdfBrowserSession()
    return task(session)
  })

  pdfTaskQueue = nextTask.then(
    () => undefined,
    () => undefined
  )

  return nextTask
}
