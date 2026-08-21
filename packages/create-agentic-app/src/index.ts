import path from "node:path"
import { parseArgs, validateArgs } from "./cli.js"
import { TEMPLATE_SOURCES } from "./paths.js"
import { copyTemplate, isNonEmptyDir } from "./template-copy.js"
import { ensureEnvPlaceholders, ensureEnvFile } from "./env-writer.js"

export function run(argv: string[]): void {
  const args = parseArgs(argv)
  const errors = validateArgs(args)

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`Error: ${err}`)
    }
    process.exit(1)
  }

  const srcDir = TEMPLATE_SOURCES[args.template]
  const targetDir = args.targetDir || path.join(process.cwd(), args.name)

  // Check target directory
  if (!args.force && isNonEmptyDir(targetDir)) {
    console.error(`Error: Target directory "${targetDir}" is not empty. Use --force to overwrite.`)
    process.exit(1)
  }

  console.log(`Scaffolding "${args.name}" from template "${args.template}"...`)
  console.log(`  Source:  ${srcDir}`)
  console.log(`  Target:  ${targetDir}`)

  // Copy template
  const copied = copyTemplate(srcDir, targetDir)
  console.log(`  Copied ${copied.length} files`)

  // Write env placeholders
  ensureEnvPlaceholders(targetDir, args.coreUrl, args.agentId)
  ensureEnvFile(targetDir)

  console.log("")
  console.log("Done! Next steps:")
  console.log("")
  console.log(`  cd ${path.relative(process.cwd(), targetDir)}`)
  console.log("  npm install")
  console.log("  # Edit .env with your API key reference")
  console.log("  npm run mcp-server   # Start MCP tool server")
  console.log("  npm run dev          # Start web app")
  console.log("")
}
