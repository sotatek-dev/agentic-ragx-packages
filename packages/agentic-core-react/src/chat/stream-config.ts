/**
 * Stage/action display configuration for stream status indicators.
 * Matches the frontend's stream-config.ts but without the `@/` import.
 */

import {
  ArrowUpDown,
  Brain,
  CheckCircle,
  CheckCircle2,
  FileSearch,
  FileText,
  GitBranch,
  PenLine,
  Search,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface StageConfig {
  icon: LucideIcon;
  label: string;
  colour: string;
}

const STAGE_CONFIG: Record<string, StageConfig> = {
  classifying_intent: {
    icon: Brain,
    label: "Classifying intent…",
    colour: "text-violet-500",
  },
  react_start: {
    icon: Zap,
    label: "Searching for information…",
    colour: "text-blue-500",
  },
  react_final: {
    icon: CheckCircle2,
    label: "Found relevant information",
    colour: "text-green-500",
  },
  llm_synthesis: {
    icon: PenLine,
    label: "Drafting the answer…",
    colour: "text-gray-500",
  },
  building_agent: {
    icon: Brain,
    label: "Preparing agent…",
    colour: "text-violet-500",
  },
  thinking: {
    icon: Brain,
    label: "Thinking…",
    colour: "text-violet-500",
  },
};

const ACTION_CONFIG: Record<string, StageConfig> = {
  vector_search: {
    icon: Search,
    label: "Searching documents…",
    colour: "text-blue-500",
  },
  keyword_search: {
    icon: FileSearch,
    label: "Searching keywords…",
    colour: "text-blue-500",
  },
  rerank_documents: {
    icon: ArrowUpDown,
    label: "Reranking results…",
    colour: "text-orange-500",
  },
  grade_relevance: {
    icon: CheckCircle,
    label: "Evaluating relevance…",
    colour: "text-yellow-500",
  },
  decompose_query: {
    icon: GitBranch,
    label: "Decomposing complex query…",
    colour: "text-purple-500",
  },
  summarize_chunks: {
    icon: FileText,
    label: "Summarizing documents…",
    colour: "text-teal-500",
  },
};

const FALLBACK_CONFIG: StageConfig = {
  icon: Brain,
  label: "Processing…",
  colour: "text-gray-400",
};

/** Resolve display config for a given stage + optional action. */
export function resolveConfig(stage: string, action?: string): StageConfig {
  if (stage === "react_act" && action && ACTION_CONFIG[action]) {
    return ACTION_CONFIG[action];
  }
  return STAGE_CONFIG[stage] ?? FALLBACK_CONFIG;
}
