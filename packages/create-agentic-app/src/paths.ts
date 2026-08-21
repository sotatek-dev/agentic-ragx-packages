import { fileURLToPath } from "node:url"
import path from "node:path"
import fs from "node:fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Maps CLI template names to directory names */
const TEMPLATE_DIR_MAP: Record<string, string> = {
  "business-app": "business-app-scaffold",
}

/**
 * Resolve template directories.
 * When installed as npm package: templates/ is bundled alongside dist/.
 * When running from repo: templates/ is at package root or repo root.
 */
function resolveTemplateSources(): Record<string, string> {
  // 1. Bundled with npm package (templates/ next to dist/)
  const bundledDir = path.resolve(__dirname, "..", "templates")
  if (fs.existsSync(bundledDir)) {
    const sources: Record<string, string> = {}
    for (const entry of fs.readdirSync(bundledDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // Map directory name to CLI template name
        const cliName = Object.entries(TEMPLATE_DIR_MAP).find(([, dir]) => dir === entry.name)?.[0] ?? entry.name
        sources[cliName] = path.join(bundledDir, entry.name)
      }
    }
    if (Object.keys(sources).length > 0) return sources
  }

  // 2. Running from repo (dev mode) — walk up to repo root
  const repoRoot = path.resolve(__dirname, "..", "..", "..")
  const repoTemplates = path.join(repoRoot, "templates")
  if (fs.existsSync(repoTemplates)) {
    const sources: Record<string, string> = {}
    for (const entry of fs.readdirSync(repoTemplates, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const cliName = Object.entries(TEMPLATE_DIR_MAP).find(([, dir]) => dir === entry.name)?.[0] ?? entry.name
        sources[cliName] = path.join(repoTemplates, entry.name)
      }
    }
    if (Object.keys(sources).length > 0) return sources
  }

  return {}
}

export const TEMPLATE_SOURCES = resolveTemplateSources()
export const TEMPLATE_NAMES = Object.keys(TEMPLATE_SOURCES)
