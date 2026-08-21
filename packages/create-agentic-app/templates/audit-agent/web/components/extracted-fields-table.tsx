"use client";

interface Field {
  id: string;
  field_key: string;
  field_label: string;
  value: string | null;
  unit: string | null;
  confidence: number | null;
  evidence_block_ids_json: string | null;
}

interface Props {
  fields: Field[];
}

export function ExtractedFieldsTable({ fields }: Props) {
  if (fields.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-4">
        No extracted fields yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-48">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-2 py-1 font-medium">Field</th>
            <th className="px-2 py-1 font-medium">Value</th>
            <th className="px-2 py-1 font-medium">Confidence</th>
            <th className="px-2 py-1 font-medium">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const evidenceIds = field.evidence_block_ids_json
              ? JSON.parse(field.evidence_block_ids_json)
              : [];
            return (
              <tr key={field.id} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1 font-medium text-gray-700">
                  {field.field_label}
                </td>
                <td className="px-2 py-1 text-gray-900 font-mono">
                  {field.value ?? "—"}
                  {field.unit && (
                    <span className="text-gray-400 ml-1">{field.unit}</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  {field.confidence !== null ? (
                    <span
                      className={`px-1 rounded ${
                        field.confidence >= 0.8
                          ? "bg-green-100 text-green-700"
                          : field.confidence >= 0.6
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {(field.confidence * 100).toFixed(0)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1 text-gray-500 font-mono">
                  {evidenceIds.length > 0
                    ? evidenceIds.map((id: string) => id.slice(0, 8)).join(", ")
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
