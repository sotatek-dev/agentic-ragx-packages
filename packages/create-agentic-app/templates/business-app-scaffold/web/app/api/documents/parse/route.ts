import { NextRequest, NextResponse } from "next/server";
import { AgenticCoreClient, AgenticHttpError } from "@sota-agentic-ragx/agentic-core-sdk";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.AGENTIC_CORE_BASE_URL;
  const apiKey = process.env.AGENTIC_CORE_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { detail: "Server configuration error" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ detail: "Missing file" }, { status: 400 });
  }

  const client = new AgenticCoreClient({ baseUrl, apiKey });

  try {
    const result = await client.documents.parse(file, {
      filename: file.name,
      mode: (formData.get("mode") as "auto" | "ocr") || "auto",
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AgenticHttpError) {
      return NextResponse.json(
        { detail: err.detail },
        {
          status:
            err.statusCode >= 400 && err.statusCode < 600
              ? err.statusCode
              : 502,
        },
      );
    }
    return NextResponse.json(
      { detail: "Document parsing failed" },
      { status: 500 },
    );
  }
}
