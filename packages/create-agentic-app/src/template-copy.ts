import fs from "node:fs"
import path from "node:path"

/** Directories and files to exclude when copying templates. */
const EXCLUDE_PATTERNS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "tsconfig.tsbuildinfo",
  ".env",         // never copy real .env — only .env.example
])

function shouldExclude(name: string): boolean {
  return EXCLUDE_PATTERNS.has(name)
}

/**
 * Recursively copy srcDir to destDir, skipping excluded patterns.
 * Returns list of copied file paths (relative to destDir).
 */
export function copyTemplate(srcDir: string, destDir: string): string[] {
  const copied: string[] = []

  function walk(currentSrc: string, currentDest: string) {
    fs.mkdirSync(currentDest, { recursive: true })

    for (const entry of fs.readdirSync(currentSrc, { withFileTypes: true })) {
      if (shouldExclude(entry.name)) continue

      const srcPath = path.join(currentSrc, entry.name)
      const destPath = path.join(currentDest, entry.name)

      if (entry.isDirectory()) {
        walk(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
        copied.push(path.relative(destDir, destPath))
      }
    }
  }

  walk(srcDir, destDir)
  return copied
}

/**
 * Check if a directory is non-empty (ignoring . and ..).
 */
export function isNonEmptyDir(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) return false
  if (!fs.statSync(dirPath).isDirectory()) return true
  const entries = fs.readdirSync(dirPath)
  return entries.length > 0
}
