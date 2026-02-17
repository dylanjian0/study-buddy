"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  BookOpen,
  ChevronDown,
  FileText,
  FileType,
  Loader2,
} from "lucide-react";

interface StudyGuideViewProps {
  content: string;
  onBack: () => void;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="list-disc pl-6 my-3 space-y-1.5"
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(trimmed.slice(2));
      continue;
    } else if (trimmed.match(/^\d+\.\s/)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
      continue;
    } else {
      flushList();
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold text-gray-900 mt-6 mb-2">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-gray-200" />);
    } else if (trimmed === "") {
      elements.push(<div key={`space-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 leading-relaxed my-2">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();
  return elements;
}

function markdownToHtml(text: string): string {
  let html = text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;color:#111827;margin-top:24px;margin-bottom:8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:20px;font-weight:700;color:#111827;margin-top:32px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:24px;font-weight:700;color:#111827;margin-top:32px;margin-bottom:16px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;color:#4338ca;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
    .replace(/^---$/gm, '<hr style="margin:24px 0;border-color:#e5e7eb;">')
    .replace(/^- (.+)$/gm, '<li style="margin-left:24px;margin-bottom:4px;color:#374151;">$1</li>')
    .replace(/^\* (.+)$/gm, '<li style="margin-left:24px;margin-bottom:4px;color:#374151;">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:24px;margin-bottom:4px;color:#374151;">$1</li>');

  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    (match) => `<ul style="list-style-type:disc;padding-left:16px;margin:12px 0;">${match}</ul>`
  );

  const lines = html.split("\n");
  const processed = lines.map((line) => {
    const trimmed = line.trim();
    if (
      trimmed === "" ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("</") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("<code") ||
      trimmed.startsWith("<strong") ||
      trimmed.startsWith("<em")
    ) {
      return line;
    }
    if (trimmed.length > 0 && !trimmed.startsWith("<")) {
      return `<p style="color:#374151;line-height:1.7;margin:8px 0;">${trimmed}</p>`;
    }
    return line;
  });

  return processed.join("\n");
}

export default function StudyGuideView({
  content,
  onBack,
}: StudyGuideViewProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-guide.md";
    a.click();
    URL.revokeObjectURL(url);
    setShowDropdown(false);
    toast.success("Markdown downloaded");
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    setShowDropdown(false);

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const htmlContent = markdownToHtml(content);
      const container = document.createElement("div");
      container.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 100%; padding: 40px; color: #111827;">
          <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #6366f1;">
            <h1 style="font-size: 28px; font-weight: 700; color: #4338ca; margin: 0 0 4px 0;">Study Guide</h1>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">Generated by StudyBuddy</p>
          </div>
          ${htmlContent}
        </div>
      `;
      document.body.appendChild(container);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html2pdf() as any)
        .set({
          margin: [10, 15, 10, 15],
          filename: "study-guide.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to review
        </button>

        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl
              hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-60"
          >
            {generatingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {generatingPdf ? "Generating PDF..." : "Download"}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </motion.button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
              >
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                    hover:bg-gray-50 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Markdown</p>
                    <p className="text-xs text-gray-400">.md file</p>
                  </div>
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                    hover:bg-gray-50 transition-colors text-left"
                >
                  <FileType className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">PDF</p>
                    <p className="text-xs text-gray-400">.pdf document</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6">
          <div className="flex items-center gap-3 text-white">
            <BookOpen className="w-6 h-6" />
            <h2 className="text-xl font-bold">Your Personal Study Guide</h2>
          </div>
          <p className="text-indigo-100 text-sm mt-1">
            Tailored to your understanding level
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="p-8"
        >
          {renderMarkdown(content)}
        </motion.div>
      </div>
    </motion.div>
  );
}
