/**
 * File: src/shared/lib/browser-platform.ts
 * Purpose: Browser capability helpers shared by mobile-specific workspace actions.
 * Why it exists: the app needs a tiny reusable way to detect iOS-like devices for download and editor behavior without scattering user-agent checks.
 * What it does: exposes a conservative Apple mobile detection helper used by PDF export and any future touch-specific workarounds.
 * Connected to: document action helpers and any other platform-sensitive client flows.
 */

// Detect Apple touch devices so iPhone/iPad Safari flows can use browser-specific fallbacks without changing desktop behavior.
export function isIOSLikeDevice() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent
  const isIPhoneOrIPod = /iPhone|iPod/.test(userAgent)
  const isIPadLike = /iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return isIPhoneOrIPod || isIPadLike
}
