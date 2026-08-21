#!/usr/bin/env node

/**
 * register-core-skill.mjs
 *
 * Idempotent script to register the Finance Audit Sample skill with
 * Agentic Core. Safe to run multiple times.
 *
 * Required env vars:
 *   AGENTIC_CORE_BASE_URL  - Core API base URL (e.g., http://localhost:8000)
 *   AGENTIC_CORE_API_KEY   - API key with skills:write, agents:write scopes
 *   AGENTIC_CORE_AGENT_ID  - Agent ID to attach the skill to
 *   BUSINESS_APP_MCP_URL   - MCP server URL (e.g., http://localhost:8765/mcp)
 *   BUSINESS_APP_MCP_TOKEN_REF - Env var name holding the MCP auth token
 */

const SKILL_NAME = "Finance Audit Sample";
const SKILL_DESCRIPTION =
  "Template MCP skill for sample finance document tools.";
const PROMPT_FRAGMENT =
  "Use finance document tools only for the sample document. " +
  "Cite fields as [Field: key], blocks as [Block: id, page N], and rule results as [Rule: id]. " +
  "If a tool returns no matching data, say what could not be checked.";

const TOOLS = [
  {
    tool_name: "get_fields",
    description_override:
      "Return extracted finance fields for a sample document.",
  },
  {
    tool_name: "get_blocks",
    description_override:
      "Return text/table block snippets, optionally filtered by page.",
  },
  {
    tool_name: "get_rule_results",
    description_override:
      "Return validation rule outcomes (pass/fail/warning).",
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
const MCP_URL = requireEnv("BUSINESS_APP_MCP_URL");
const MCP_TOKEN_REF = requireEnv("BUSINESS_APP_MCP_TOKEN_REF");

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
  console.log("Registering Finance Audit Sample skill...\n");

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
  console.log("\nNext steps:");
  console.log("1. Start the MCP server:    cd mcp-server && mcp-server");
  console.log("2. Start the web app:       cd web && npm run dev");
  console.log(
    "3. Open http://localhost:3001 and chat with the agent"
  );
  console.log(
    '4. Try: "What finance fields are available and which rules failed?"'
  );
}

main().catch((err) => {
  console.error("Registration failed:", err.message);
  process.exit(1);
});
