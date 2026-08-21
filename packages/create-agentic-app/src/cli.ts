import { TEMPLATE_NAMES } from "./paths.js"

export interface CliArgs {
  template: string
  name: string
  targetDir: string
  coreUrl: string
  agentId: string
  force: boolean
}

const USAGE = `Usage: npm create agentic-app -- [options]

Options:
  --template <name>    Template to use: ${TEMPLATE_NAMES.join(", ")}
  --name <name>        Project name (also used as slug)
  --target-dir <path>  Target directory (default: ./<name>)
  --core-url <url>     Core API URL (default: http://localhost:8000)
  --agent-id <id>      Agent ID to link
  --force              Overwrite non-empty target directory
  -h, --help           Show this help
`

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    template: "",
    name: "",
    targetDir: "",
    coreUrl: "http://localhost:8000",
    agentId: "",
    force: false,
  }

  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    switch (arg) {
      case "--template":
        args.template = argv[++i] ?? ""
        break
      case "--name":
        args.name = argv[++i] ?? ""
        break
      case "--target-dir":
        args.targetDir = argv[++i] ?? ""
        break
      case "--core-url":
        args.coreUrl = argv[++i] ?? ""
        break
      case "--agent-id":
        args.agentId = argv[++i] ?? ""
        break
      case "--force":
        args.force = true
        break
      case "-h":
      case "--help":
        console.log(USAGE)
        process.exit(0)
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`)
          console.error(USAGE)
          process.exit(1)
        }
        // Positional arg = name
        if (!args.name) {
          args.name = arg
        }
        break
    }
    i++
  }

  return args
}

export function validateArgs(args: CliArgs): string[] {
  const errors: string[] = []

  if (!args.template) {
    errors.push("--template is required")
  } else if (!TEMPLATE_NAMES.includes(args.template)) {
    errors.push(`Unknown template "${args.template}". Available: ${TEMPLATE_NAMES.join(", ")}`)
  }

  if (!args.name) {
    errors.push("--name is required")
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.name)) {
    errors.push("--name must be lowercase alphanumeric with hyphens")
  }

  return errors
}
