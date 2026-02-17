"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

interface PDFUploadProps {
  onUploadComplete: (documentId: string) => void;
}

export default function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setProgress(0);

      // Simulate progress ticks while the upload is running
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          return p + Math.random() * 12;
        });
      }, 400);

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

        setProgress(100);
        clearInterval(interval);
        toast.success(`"${file.name}" processed — ${data.sentenceCount} sentences extracted`);

        setTimeout(() => {
          onUploadComplete(data.documentId);
        }, 400);
      } catch (err) {
        clearInterval(interval);
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
      } finally {
        setUploading(false);
        setProgress(0);
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
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <motion.div
          whileHover={!uploading ? { scale: 1.01 } : {}}
          whileTap={!uploading ? { scale: 0.99 } : {}}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out overflow-hidden
            ${
              isDragActive
                ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
            }
            ${uploading ? "pointer-events-none" : ""}
          `}
        >

        {/* Progress bar overlay */}
        {uploading && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        )}

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center"
              >
                <FileText className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Processing your PDF...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Extracting text and breaking it into sentences
                </p>
                <p className="text-xs text-indigo-500 font-medium mt-2">
                  {Math.round(progress)}%
                </p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center"
              >
                <FileText className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <p className="text-lg font-semibold text-indigo-600">
                Drop your PDF here!
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center transition-colors">
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
      </motion.div>
      </div>
    </div>
  );
}
