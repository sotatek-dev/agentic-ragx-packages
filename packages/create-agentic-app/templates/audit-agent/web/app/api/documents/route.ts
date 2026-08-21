/**
 * GET /api/documents — list all documents.
 */

import { NextResponse } from "next/server";
import { listDocuments } from "@/server/db/repository";

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json(documents);
}
