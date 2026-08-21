import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { parseArgs, validateArgs } from "../src/cli.js"
import { copyTemplate, isNonEmptyDir } from "../src/template-copy.js"
import { ensureEnvPlaceholders, ensureEnvFile } from "../src/env-writer.js"
import { TEMPLATE_SOURCES } from "../src/paths.js"

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-agentic-app-"))
}

function cleanupTmpDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  it("parses all flags", () => {
    const args = parseArgs([
      "--template", "business-app",
      "--name", "my-app",
      "--target-dir", "/tmp/my-app",
      "--core-url", "http://localhost:9000",
      "--agent-id", "abc-123",
      "--force",
    ])
    expect(args.template).toBe("business-app")
    expect(args.name).toBe("my-app")
    expect(args.targetDir).toBe("/tmp/my-app")
    expect(args.coreUrl).toBe("http://localhost:9000")
    expect(args.agentId).toBe("abc-123")
    expect(args.force).toBe(true)
  })

  it("uses defaults", () => {
    const args = parseArgs(["--template", "audit-agent", "--name", "test"])
    expect(args.coreUrl).toBe("http://localhost:8000")
    expect(args.force).toBe(false)
    expect(args.targetDir).toBe("")
  })

  it("accepts positional name", () => {
    const args = parseArgs(["--template", "business-app", "my-app"])
    expect(args.name).toBe("my-app")
  })
})

describe("validateArgs", () => {
  it("returns no errors for valid args", () => {
    const errors = validateArgs({ template: "business-app", name: "my-app", targetDir: "", coreUrl: "http://localhost:8000", agentId: "", force: false })
    expect(errors).toEqual([])
  })

  it("requires template", () => {
    const errors = validateArgs({ template: "", name: "my-app", targetDir: "", coreUrl: "", agentId: "", force: false })
    expect(errors).toContain("--template is required")
  })

  it("rejects unknown template", () => {
    const errors = validateArgs({ template: "nope", name: "my-app", targetDir: "", coreUrl: "", agentId: "", force: false })
    expect(errors.some((e) => e.includes("Unknown template"))).toBe(true)
  })

  it("requires name", () => {
    const errors = validateArgs({ template: "business-app", name: "", targetDir: "", coreUrl: "", agentId: "", force: false })
    expect(errors).toContain("--name is required")
  })

  it("rejects invalid name", () => {
    const errors = validateArgs({ template: "business-app", name: "My App!", targetDir: "", coreUrl: "", agentId: "", force: false })
    expect(errors.some((e) => e.includes("lowercase"))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Template copy
// ---------------------------------------------------------------------------

describe("copyTemplate", () => {
  let srcDir: string
  let destDir: string

  beforeEach(() => {
    srcDir = makeTmpDir()
    destDir = makeTmpDir()
    // Create source structure
    fs.mkdirSync(path.join(srcDir, "sub"))
    fs.writeFileSync(path.join(srcDir, "file1.txt"), "hello")
    fs.writeFileSync(path.join(srcDir, "sub", "file2.txt"), "world")
    fs.writeFileSync(path.join(srcDir, ".env.example"), "KEY=val")
    // Create excluded dirs
    fs.mkdirSync(path.join(srcDir, "node_modules"))
    fs.writeFileSync(path.join(srcDir, "node_modules", "pkg.js"), "skip me")
    fs.mkdirSync(path.join(srcDir, ".next"))
    fs.writeFileSync(path.join(srcDir, ".next", "build.js"), "skip me")
  })

  afterEach(() => {
    cleanupTmpDir(srcDir)
    cleanupTmpDir(destDir)
  })

  it("copies files recursively", () => {
    const copied = copyTemplate(srcDir, destDir)
    expect(copied).toContain("file1.txt")
    expect(copied).toContain(path.join("sub", "file2.txt"))
    expect(fs.readFileSync(path.join(destDir, "file1.txt"), "utf-8")).toBe("hello")
    expect(fs.readFileSync(path.join(destDir, "sub", "file2.txt"), "utf-8")).toBe("world")
  })

  it("excludes node_modules and .next", () => {
    copyTemplate(srcDir, destDir)
    expect(fs.existsSync(path.join(destDir, "node_modules"))).toBe(false)
    expect(fs.existsSync(path.join(destDir, ".next"))).toBe(false)
  })

  it("copies .env.example", () => {
    copyTemplate(srcDir, destDir)
    expect(fs.existsSync(path.join(destDir, ".env.example"))).toBe(true)
  })

  it("copies dot directories (.agents, .claude)", () => {
    // Create dot directory structure in source
    fs.mkdirSync(path.join(srcDir, ".agents", "skills", "test-skill"), { recursive: true })
    fs.writeFileSync(path.join(srcDir, ".agents", "skills", "test-skill", "SKILL.md"), "# Test Skill")
    fs.mkdirSync(path.join(srcDir, ".claude", "skills", "test-skill"), { recursive: true })
    fs.writeFileSync(path.join(srcDir, ".claude", "skills", "test-skill", "SKILL.md"), "# Test Skill")

    const copied = copyTemplate(srcDir, destDir)
    expect(copied).toContain(path.join(".agents", "skills", "test-skill", "SKILL.md"))
    expect(copied).toContain(path.join(".claude", "skills", "test-skill", "SKILL.md"))
    expect(fs.existsSync(path.join(destDir, ".agents", "skills", "test-skill", "SKILL.md"))).toBe(true)
    expect(fs.existsSync(path.join(destDir, ".claude", "skills", "test-skill", "SKILL.md"))).toBe(true)
  })
})

describe("isNonEmptyDir", () => {
  it("returns false for nonexistent dir", () => {
    expect(isNonEmptyDir("/tmp/nonexistent-dir-12345")).toBe(false)
  })

  it("returns false for empty dir", () => {
    const dir = makeTmpDir()
    try {
      expect(isNonEmptyDir(dir)).toBe(false)
    } finally {
      cleanupTmpDir(dir)
    }
  })

  it("returns true for non-empty dir", () => {
    const dir = makeTmpDir()
    fs.writeFileSync(path.join(dir, "file.txt"), "x")
    try {
      expect(isNonEmptyDir(dir)).toBe(true)
    } finally {
      cleanupTmpDir(dir)
    }
  })
})

// ---------------------------------------------------------------------------
// Template skill files
// ---------------------------------------------------------------------------

describe("business-app template skills", () => {
  const SKILL_NAMES = [
    "agentic-app-create",
    "agentic-sdk-integrate",
    "agentic-ui-kit-integrate",
    "agentic-mcp-skill-create",
  ]

  it("has all 4 Codex skill files (.agents/skills)", () => {
    const templateDir = TEMPLATE_SOURCES["business-app"]
    for (const skill of SKILL_NAMES) {
      const skillPath = path.join(templateDir, ".agents", "skills", skill, "SKILL.md")
      expect(fs.existsSync(skillPath), `Missing Codex skill: ${skillPath}`).toBe(true)
      const content = fs.readFileSync(skillPath, "utf-8")
      expect(content).toContain(`name: ${skill}`)
    }
  })

  it("has all 4 Claude skill files (.claude/skills)", () => {
    const templateDir = TEMPLATE_SOURCES["business-app"]
    for (const skill of SKILL_NAMES) {
      const skillPath = path.join(templateDir, ".claude", "skills", skill, "SKILL.md")
      expect(fs.existsSync(skillPath), `Missing Claude skill: ${skillPath}`).toBe(true)
      const content = fs.readFileSync(skillPath, "utf-8")
      expect(content).toContain(`name: ${skill}`)
    }
  })

  it("skills mention scoped package names", () => {
    const templateDir = TEMPLATE_SOURCES["business-app"]
    const sdkSkill = path.join(templateDir, ".agents", "skills", "agentic-sdk-integrate", "SKILL.md")
    const content = fs.readFileSync(sdkSkill, "utf-8")
    expect(content).toContain("@sotatek-dev/agentic-core-sdk")
  })
})

// ---------------------------------------------------------------------------
// Env writer
// ---------------------------------------------------------------------------

describe("ensureEnvPlaceholders", () => {
  let dir: string

  beforeEach(() => {
    dir = makeTmpDir()
  })

  afterEach(() => cleanupTmpDir(dir))

  it("creates .env.example when missing", () => {
    ensureEnvPlaceholders(dir, "http://localhost:8000", "agent-123")
    const content = fs.readFileSync(path.join(dir, ".env.example"), "utf-8")
    expect(content).toContain("CORE_URL=http://localhost:8000")
    expect(content).toContain("AGENT_ID=agent-123")
  })

  it("updates existing .env.example", () => {
    fs.writeFileSync(path.join(dir, ".env.example"), "CORE_URL=http://old.com\nAGENT_ID=old-id")
    ensureEnvPlaceholders(dir, "http://new.com", "new-id")
    const content = fs.readFileSync(path.join(dir, ".env.example"), "utf-8")
    expect(content).toContain("CORE_URL=http://new.com")
    expect(content).toContain("AGENT_ID=new-id")
  })
})

describe("ensureEnvFile", () => {
  let dir: string

  beforeEach(() => {
    dir = makeTmpDir()
  })

  afterEach(() => cleanupTmpDir(dir))

  it("copies .env.example to .env", () => {
    fs.writeFileSync(path.join(dir, ".env.example"), "KEY=val")
    ensureEnvFile(dir)
    expect(fs.readFileSync(path.join(dir, ".env"), "utf-8")).toBe("KEY=val")
  })

  it("does not overwrite existing .env", () => {
    fs.writeFileSync(path.join(dir, ".env.example"), "KEY=new")
    fs.writeFileSync(path.join(dir, ".env"), "KEY=old")
    ensureEnvFile(dir)
    expect(fs.readFileSync(path.join(dir, ".env"), "utf-8")).toBe("KEY=old")
  })

  it("no-op when .env.example missing", () => {
    ensureEnvFile(dir)
    expect(fs.existsSync(path.join(dir, ".env"))).toBe(false)
  })
})
