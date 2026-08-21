#!/usr/bin/env node

// For development (source mode), use tsx or run compiled output.
// This bin entry loads the compiled dist/ output.

import { run } from "../dist/index.js"

run(process.argv.slice(2))
