"use client";

import { FileText, Table } from "lucide-react";

interface Block {
  id: string;
  page: number;
  block_type: string;
  text: string | null;
  html: string | null;
}

interface Props {
  blocks: Block[];
}

export function DocumentBlockList({ blocks }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-4">
        No parsed blocks yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-auto">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="border rounded p-2 bg-gray-50 text-xs"
        >
          <div className="flex items-center gap-2 mb-1">
            {block.block_type === "table" ? (
              <Table className="w-3 h-3 text-green-500" />
            ) : (
              <FileText className="w-3 h-3 text-blue-500" />
            )}
            <span className="font-mono text-gray-500">
              {block.id.slice(0, 8)}
            </span>
            <span className="text-gray-400">p.{block.page}</span>
            <span className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">
              {block.block_type}
            </span>
          </div>
          {block.text && (
            <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">
              {block.text}
            </p>
          )}
          {block.html && !block.text && (
            <div
              className="text-gray-600 [&_table]:text-[10px] [&_td]:px-1 [&_th]:px-1"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
