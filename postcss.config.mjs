/**
 * File: postcss.config.mjs
 * Purpose: Tailwind v4 PostCSS bridge for the Next.js app.
 * Why it exists: Tailwind needs the PostCSS plugin entry so the design tokens and utility classes are compiled correctly.
 * What it does: registers the Tailwind CSS PostCSS plugin used by `src/app/globals.css`.
 * Connected to: `tailwindcss`, the global stylesheet, and every UI component that relies on Tailwind utilities.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
