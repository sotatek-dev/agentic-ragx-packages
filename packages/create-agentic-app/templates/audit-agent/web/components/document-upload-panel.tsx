"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface Props {
  onUploadComplete: (documentId: string) => void;
}

export function DocumentUploadPanel({ onUploadComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || `Upload failed (${res.status})`);
      }

      const payload = await res.json();
      onUploadComplete(payload.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Document
      </h3>
      <label
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          uploading
            ? "border-gray-300 bg-gray-50"
            : "border-blue-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          <FileText className="w-5 h-5 text-blue-400" />
        )}
        <span className="text-sm text-gray-600">
          {uploading ? "Processing..." : "Choose PDF or image"}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.txt,.csv"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
