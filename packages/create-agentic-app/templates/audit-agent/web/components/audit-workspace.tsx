"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { DocumentUploadPanel } from "./document-upload-panel";
import { DocumentBlockList } from "./document-block-list";
import { ExtractedFieldsTable } from "./extracted-fields-table";
import { RuleResultsPanel } from "./rule-results-panel";
import { AuditChatPanel } from "./audit-chat-panel";

interface Document {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  parsed_at: string | null;
  error_message: string | null;
}

interface Block {
  id: string;
  page: number;
  block_type: string;
  text: string | null;
  html: string | null;
}

interface Field {
  id: string;
  field_key: string;
  field_label: string;
  value: string | null;
  unit: string | null;
  confidence: number | null;
  evidence_block_ids_json: string | null;
}

interface RuleResult {
  id: string;
  rule_id: string;
  severity: string;
  status: string;
  message: string | null;
  evidence_block_ids_json: string | null;
}

interface WorkspacePayload {
  document: Document;
  blocks: Block[];
  fields: Field[];
  rule_results: RuleResult[];
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-600" },
  ready: { label: "Ready", color: "bg-green-100 text-green-600" },
  needs_review: { label: "Needs Review", color: "bg-yellow-100 text-yellow-600" },
  parse_failed: { label: "Parse Failed", color: "bg-red-100 text-red-600" },
  auth_error: { label: "Auth Error", color: "bg-red-100 text-red-600" },
  unsupported: { label: "Unsupported", color: "bg-red-100 text-red-600" },
};

export function AuditWorkspace() {
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID || "";
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      setDocuments(await res.json());
    }
  }, []);

  const fetchWorkspace = useCallback(async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (res.ok) {
        setWorkspace(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (activeDocId) {
      fetchWorkspace(activeDocId);
    }
  }, [activeDocId, fetchWorkspace]);

  const handleUploadComplete = (documentId: string) => {
    fetchDocuments();
    setActiveDocId(documentId);
  };

  const docStatus = workspace?.document
    ? STATUS_BADGE[workspace.document.status] || STATUS_BADGE.pending
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Document workspace */}
      <div className="w-1/2 flex flex-col border-r overflow-hidden">
        <header className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Agent
          </h1>
          <button
            onClick={() => activeDocId && fetchWorkspace(activeDocId)}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <DocumentUploadPanel onUploadComplete={handleUploadComplete} />

          {/* Document selector */}
          {documents.length > 0 && (
            <div className="border rounded-lg p-3 bg-white">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">
                Documents
              </h3>
              <div className="space-y-1">
                {documents.map((doc) => {
                  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.pending;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                        activeDocId === doc.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{doc.filename}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workspace content */}
          {workspace && (
            <>
              {workspace.document.error_message && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50 text-xs text-red-700">
                  {workspace.document.error_message}
                </div>
              )}

              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Parsed Blocks ({workspace.blocks.length})
                </h3>
                <DocumentBlockList blocks={workspace.blocks} />
              </div>

              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Extracted Fields ({workspace.fields.length})
                </h3>
                <ExtractedFieldsTable fields={workspace.fields} />
              </div>

              <div className="border rounded-lg p-3 bg-white">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Rule Results ({workspace.rule_results.length})
                </h3>
                <RuleResultsPanel ruleResults={workspace.rule_results} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="w-1/2 p-4">
        {agentId ? (
          <AuditChatPanel agentId={agentId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="p-6 bg-white rounded-lg shadow-sm border max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-2">No Agent ID</h2>
              <p className="text-sm text-gray-500">
                Set NEXT_PUBLIC_AGENT_ID in .env to enable chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
