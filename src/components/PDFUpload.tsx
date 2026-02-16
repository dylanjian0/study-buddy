"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";

interface PDFUploadProps {
  onUploadComplete: (documentId: string) => void;
}

export default function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onUploadComplete(data.documentId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${
            isDragActive
              ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Processing your PDF...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Extracting text and breaking it into sentences
                </p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center animate-bounce">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-lg font-semibold text-indigo-600">
                Drop your PDF here!
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Upload your study material
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop a PDF here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF files only, up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
