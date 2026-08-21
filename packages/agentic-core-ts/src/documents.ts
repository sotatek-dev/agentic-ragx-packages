/** Documents resource -- parse/OCR files through Core API. */

import { AgenticHttpError } from "./errors.js";

export interface ParseOptions {
  /** Original filename (optional). */
  filename?: string;
  /** Processing mode: "auto" selects provider, "ocr" forces OCR. */
  mode?: "auto" | "ocr";
}

export interface ParsedPage {
  page_index: number;
  provider_page_width: number;
  provider_page_height: number;
  source_display_width_pt: number;
  source_display_height_pt: number;
  rotation: number;
}

export interface ParsedBlock {
  stable_id: string;
  block_type: string;
  page_index: number;
  polygon: number[][];
  bbox: number[];
  raw_markdown?: string;
  raw_html?: string;
  raw_text?: string;
  normalized_text?: string;
}

export interface ParseResult {
  document_id: string;
  filename: string;
  provider: string;
  quality_score: number | null;
  pages: ParsedPage[];
  blocks: ParsedBlock[];
  raw_response_included: boolean;
}

/** Documents resource bound to a client configuration. */
export class DocumentsResource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchFn: typeof globalThis.fetch,
  ) {}

  /**
   * Parse/OCR a document file through Core Document Processing API.
   *
   * @param file - File data as Buffer, Blob, or ReadableStream.
   * @param options - Parse options (filename, mode).
   * @returns Normalized parse result with pages and blocks.
   */
  async parse(
    file: Buffer | Blob | ReadableStream,
    options: ParseOptions = {},
  ): Promise<ParseResult> {
    const url = `${this.baseUrl}/v1/document-processing/parse`;

    // Build FormData
    const formData = new FormData();

    // Convert to Blob if needed
    let blob: Blob;
    if (file instanceof Blob) {
      blob = file;
    } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(file)) {
      // Buffer -> Uint8Array with explicit ArrayBuffer for TS compatibility
      const ab = new ArrayBuffer((file as Buffer).length);
      new Uint8Array(ab).set(new Uint8Array(file as Buffer));
      blob = new Blob([new Uint8Array(ab)]);
    } else {
      // ReadableStream -> Blob
      const chunks: ArrayBuffer[] = [];
      const reader = (file as ReadableStream).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Convert each chunk to ArrayBuffer for BlobPart compatibility
        const ab = new ArrayBuffer(value.length);
        new Uint8Array(ab).set(value);
        chunks.push(ab);
      }
      blob = new Blob(chunks);
    }

    formData.append("file", blob, options.filename);

    if (options.filename) {
      formData.append("filename", options.filename);
    }
    if (options.mode) {
      formData.append("mode", options.mode);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });
    } catch (err) {
      throw new AgenticHttpError(
        0,
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        detail = parsed.detail ?? body;
      } catch {
        // use default detail
      }
      throw new AgenticHttpError(response.status, detail);
    }

    return response.json() as Promise<ParseResult>;
  }
}
