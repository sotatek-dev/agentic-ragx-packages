/**
 * Boundary import test — ensures no files under examples/audit-agent
 * import from backend/ or Core Python internals.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(__dirname, "..");
const FORBIDDEN_PATTERNS = [
  /from\s+['"]backend[/'"]/,
  /from\s+['"]backend\./,
  /import\s+['"]backend[/'"]/,
  /require\(['"]backend[/'"]/,
];

function walkTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist
      if (["node_modules", ".next", "dist", ".git"].includes(entry)) continue;
      results.push(...walkTsFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

describe("boundary imports", () => {
  it("should not import from backend/ or Core Python internals", () => {
    const files = walkTsFiles(ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${relative(ROOT, file)}: matched ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
