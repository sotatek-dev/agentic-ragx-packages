import fs from "node:fs"
import path from "node:path"

/**
 * Write or update .env.example with safe placeholders.
 * If .env.example already exists in the template, it's preserved.
 * Otherwise, a minimal one is created.
 */
export function ensureEnvPlaceholders(targetDir: string, coreUrl: string, agentId: string): void {
  const envExamplePath = path.join(targetDir, ".env.example")

  if (fs.existsSync(envExamplePath)) {
    // Update existing .env.example with provided values
    let content = fs.readFileSync(envExamplePath, "utf-8")
    content = content.replace(/^CORE_URL=.*$/m, `CORE_URL=${coreUrl}`)
    content = content.replace(/^AGENT_ID=.*$/m, `AGENT_ID=${agentId || "<your-agent-id>"}`)
    fs.writeFileSync(envExamplePath, content, "utf-8")
    return
  }

  // Create minimal .env.example
  const lines = [
    "# Agentic Core connection",
    `CORE_URL=${coreUrl}`,
    `AGENT_ID=${agentId || "<your-agent-id>"}`,
    "",
    "# API key — set this in your shell, not here",
    "API_KEY_REF=MY_APP_API_KEY",
    "",
    "# MCP server port",
    "MCP_PORT=3100",
    "",
  ]
  fs.writeFileSync(envExamplePath, lines.join("\n"), "utf-8")
}

/**
 * Ensure .env exists as a copy of .env.example (safe defaults).
 * Does NOT overwrite an existing .env.
 */
export function ensureEnvFile(targetDir: string): void {
  const envPath = path.join(targetDir, ".env")
  const envExamplePath = path.join(targetDir, ".env.example")

  if (fs.existsSync(envPath)) return
  if (!fs.existsSync(envExamplePath)) return

  fs.copyFileSync(envExamplePath, envPath)
}
