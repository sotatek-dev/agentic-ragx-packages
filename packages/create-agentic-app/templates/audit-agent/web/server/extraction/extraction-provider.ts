/**
 * Extraction provider interface.
 * Implementations extract structured fields from parsed document blocks.
 */

export interface ExtractedField {
  field_key: string;
  field_label: string;
  value: string;
  unit?: string;
  confidence: number;
  evidence_block_ids: string[];
}

export interface ExtractionResult {
  fields: ExtractedField[];
}

export interface ExtractionProvider {
  extract(params: {
    documentId: string;
    filename: string;
    blocks: Array<{ id: string; page: number; block_type: string; text: string | null }>;
  }): Promise<ExtractionResult>;
}
