/**
 * GET /api/documents/[documentId] — get document workspace payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePayload } from "@/server/db/repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const payload = await getWorkspacePayload(documentId);

  if (!payload) {
    return NextResponse.json(
      { detail: "Document not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(payload);
}
