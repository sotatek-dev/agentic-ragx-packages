"use client";

import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface RuleResult {
  id: string;
  rule_id: string;
  severity: string;
  status: string;
  message: string | null;
  evidence_block_ids_json: string | null;
}

interface Props {
  ruleResults: RuleResult[];
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
  fail: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  error: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
} as const;

export function RuleResultsPanel({ ruleResults }: Props) {
  if (ruleResults.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-4">
        No rule results yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ruleResults.map((rule) => {
        const config = STATUS_CONFIG[rule.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.error;
        const Icon = config.icon;
        const evidenceIds = rule.evidence_block_ids_json
          ? JSON.parse(rule.evidence_block_ids_json)
          : [];

        return (
          <div
            key={rule.id}
            className={`border rounded p-2 ${config.bg} text-xs`}
          >
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 ${config.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-medium">{rule.rule_id}</span>
                  <span className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">
                    {rule.severity}
                  </span>
                </div>
                {rule.message && (
                  <p className="text-gray-600">{rule.message}</p>
                )}
                {evidenceIds.length > 0 && (
                  <p className="text-gray-400 mt-1 font-mono text-[10px]">
                    Evidence: {evidenceIds.map((id: string) => id.slice(0, 8)).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
