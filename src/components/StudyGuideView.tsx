"use client";

import { ArrowLeft, Download, BookOpen } from "lucide-react";

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
        <ul key={`list-${elements.length}`} className="list-disc pl-6 my-3 space-y-1.5">
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
        <h3
          key={`h3-${i}`}
          className="text-lg font-semibold text-gray-900 mt-6 mb-2"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-2xl font-bold text-gray-900 mt-8 mb-4"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed === "---") {
      elements.push(
        <hr key={`hr-${i}`} className="my-6 border-gray-200" />
      );
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

export default function StudyGuideView({
  content,
  onBack,
}: StudyGuideViewProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-guide.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to review
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl
            hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
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
        <div className="p-8">{renderMarkdown(content)}</div>
      </div>
    </div>
  );
}
