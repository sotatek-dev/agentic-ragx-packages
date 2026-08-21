#!/usr/bin/env node

/**
 * register-audit-skill.mjs
 *
 * Idempotent script to register the Audit Agent Dogfood skill with
 * Agentic Core. Safe to run multiple times.
 *
 * Loads env vars from ../.env automatically.
 *
 * Required env vars:
 *   AGENTIC_CORE_BASE_URL  - Core API base URL (e.g., http://localhost:8000)
 *   AGENTIC_CORE_API_KEY   - API key with skills:write, agents:write scopes
 *   AGENTIC_CORE_AGENT_ID  - Agent ID to attach the skill to
 *   AUDIT_MCP_URL          - MCP server URL (e.g., http://localhost:8765/mcp)
 *   AUDIT_MCP_TOKEN_REF    - Env var name holding the MCP auth token
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from parent directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log(`Loaded env from ${envPath}\n`);
} catch {
  console.log(`No .env found at ${envPath}, using existing env vars.\n`);
}

const SKILL_NAME = "Audit Agent Dogfood";
const SKILL_DESCRIPTION =
  "Standalone audit agent skill with document evidence lookup, field extraction, rule checks, and audit findings summary.";
const PROMPT_FRAGMENT =
  "Use audit tools to inspect document evidence, extracted fields, and rule results. " +
  "Cite fields as [Field: key], blocks as [Block: id, page N], and rule results as [Rule: id]. " +
  "If a tool returns no matching data, say what could not be checked.";

const TOOLS = [
  {
    tool_name: "lookup_evidence",
    description_override:
      "Find evidence blocks in a document by text search or page number.",
  },
  {
    tool_name: "get_extracted_fields",
    description_override:
      "Return extracted financial fields for a document, optionally filtered by field keys.",
  },
  {
    tool_name: "check_financial_statement_rules",
    description_override:
      "Return audit rule results (pass/fail/warning) for a document.",
  },
  {
    tool_name: "summarize_audit_findings",
    description_override:
      "Aggregate audit findings: failed rules, field coverage, and evidence references.",
  },
];

// --- Env validation ---

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`Error: ${name} environment variable is required.`);
    process.exit(1);
  }
  return val;
}

const BASE_URL = requireEnv("AGENTIC_CORE_BASE_URL").replace(/\/+$/, "");
const API_KEY = requireEnv("AGENTIC_CORE_API_KEY");
const AGENT_ID = requireEnv("AGENTIC_CORE_AGENT_ID");
const MCP_URL = requireEnv("AUDIT_MCP_URL");
const MCP_TOKEN_REF = requireEnv("AUDIT_MCP_TOKEN_REF");

// --- HTTP helper ---

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      `API ${method} ${path} returned ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return data;
}

// --- Skill CRUD ---

async function findSkill() {
  const skills = await api("GET", "/v1/skills");
  return skills.find((s) => s.name === SKILL_NAME) || null;
}

async function createSkill() {
  return api("POST", "/v1/skills", {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    source_type: "mcp",
    prompt_fragment: PROMPT_FRAGMENT,
    enabled: true,
    mcp_endpoint_url: MCP_URL,
    mcp_auth_token_ref: MCP_TOKEN_REF,
  });
}

// --- Tool CRUD ---

async function findTool(skillId, toolName) {
  const tools = await api("GET", `/v1/skills/${skillId}/tools`);
  return tools.find((t) => t.tool_name === toolName) || null;
}

async function upsertTool(skillId, toolDef) {
  const existing = await findTool(skillId, toolDef.tool_name);
  if (existing) {
    return api("PATCH", `/v1/skills/${skillId}/tools/${existing.id}`, {
      description_override: toolDef.description_override,
      enabled: true,
    });
  }
  return api("POST", `/v1/skills/${skillId}/tools`, toolDef);
}

// --- Agent Skill Attachment ---

async function findAgentSkill(skillId) {
  try {
    const skills = await api("GET", `/v1/agents/${AGENT_ID}/skills`);
    return skills.find((s) => s.skill_id === skillId) || null;
  } catch {
    return null;
  }
}

async function upsertAgentSkill(skillId, allowedTools) {
  const existing = await findAgentSkill(skillId);
  if (existing) {
    return api("PATCH", `/v1/agents/${AGENT_ID}/skills/${skillId}`, {
      allowed_tools: allowedTools,
      enabled: true,
    });
  }
  return api("POST", `/v1/agents/${AGENT_ID}/skills`, {
    skill_id: skillId,
    allowed_tools: allowedTools,
    enabled: true,
  });
}

// --- Main ---

async function main() {
  console.log("Registering Audit Agent Dogfood skill...\n");

  // 1. Find or create skill
  let skill = await findSkill();
  if (skill) {
    console.log(`Skill already exists: ${skill.id}`);
  } else {
    skill = await createSkill();
    console.log(`Skill created: ${skill.id}`);
  }

  // 2. Upsert tools
  for (const toolDef of TOOLS) {
    const tool = await upsertTool(skill.id, toolDef);
    console.log(`Tool ${toolDef.tool_name}: ${tool.id}`);
  }

  // 3. Attach skill to agent
  const allowedTools = TOOLS.map((t) => t.tool_name);
  await upsertAgentSkill(skill.id, allowedTools);
  console.log(`Skill attached to agent ${AGENT_ID}`);

  // Summary
  console.log("\n--- Registration Complete ---");
  console.log(`Skill ID:   ${skill.id}`);
  console.log(`Agent ID:   ${AGENT_ID}`);
  console.log(`MCP URL:    ${MCP_URL}`);
  console.log(`Tools:      ${allowedTools.join(", ")}`);
  console.log("\nRequired API key scopes:");
  console.log("  agent:invoke, chat:write, skills:read, skills:write, agents:write, documents:parse");
  console.log("\nNext steps:");
  console.log("1. Start the MCP server:    cd mcp-server && python -m src.app");
  console.log("2. Start the web app:       cd web && npm run dev");
  console.log(
    "3. Open http://localhost:3001 and upload a financial PDF"
  );
  console.log(
    '4. Chat: "Explain the failed audit rules and cite evidence"'
  );
}

main().catch((err) => {
  console.error("Registration failed:", err.message);
  process.exit(1);
});
