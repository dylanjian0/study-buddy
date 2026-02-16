"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
  BookOpen,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Sentence, Understanding } from "@/lib/types";

interface SentenceReviewProps {
  documentId: string;
  onGenerateStudyGuide: () => void;
  onStartQuiz: () => void;
  generatingGuide: boolean;
  generatingQuiz: boolean;
}

const understandingConfig = {
  unmarked: {
    bg: "bg-white",
    border: "border-gray-200",
    hover: "hover:border-gray-300",
    icon: Circle,
    iconColor: "text-gray-300",
    label: "Not reviewed",
  },
  understood: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    hover: "hover:border-emerald-300",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    label: "Understood",
  },
  partial: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    hover: "hover:border-amber-300",
    icon: AlertCircle,
    iconColor: "text-amber-500",
    label: "Partially understood",
  },
  not_understood: {
    bg: "bg-red-50",
    border: "border-red-200",
    hover: "hover:border-red-300",
    icon: XCircle,
    iconColor: "text-red-500",
    label: "Not understood",
  },
};

export default function SentenceReview({
  documentId,
  onGenerateStudyGuide,
  onStartQuiz,
  generatingGuide,
  generatingQuiz,
}: SentenceReviewProps) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHelp, setExpandedHelp] = useState(true);

  useEffect(() => {
    fetchSentences();
  }, [documentId]);

  const fetchSentences = async () => {
    try {
      const res = await fetch(`/api/sentences/${documentId}`);
      const data = await res.json();
      setSentences(data);
    } catch (err) {
      console.error("Failed to fetch sentences:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUnderstanding = async (
    sentenceId: string,
    understanding: Understanding
  ) => {
    setSentences((prev) =>
      prev.map((s) => (s.id === sentenceId ? { ...s, understanding } : s))
    );

    try {
      await fetch(`/api/sentences/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentenceId, understanding }),
      });
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const cycleUnderstanding = (current: Understanding): Understanding => {
    const cycle: Understanding[] = [
      "unmarked",
      "understood",
      "partial",
      "not_understood",
    ];
    const idx = cycle.indexOf(current);
    return cycle[(idx + 1) % cycle.length];
  };

  const stats = {
    total: sentences.length,
    understood: sentences.filter((s) => s.understanding === "understood").length,
    partial: sentences.filter((s) => s.understanding === "partial").length,
    not_understood: sentences.filter((s) => s.understanding === "not_understood")
      .length,
    unmarked: sentences.filter((s) => s.understanding === "unmarked").length,
  };

  const reviewedCount = stats.total - stats.unmarked;
  const progress = stats.total > 0 ? (reviewedCount / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading sentences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Help Section */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setExpandedHelp(!expandedHelp)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium text-gray-700">
            How to review your material
          </span>
          {expandedHelp ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedHelp && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600 mb-3">
              Click on each sentence to cycle through understanding levels:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <Circle className="w-4 h-4 text-gray-300" />
                <span className="text-gray-600">Not reviewed</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700">Understood</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700">Partial</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Not understood</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Review Progress
          </span>
          <span className="text-sm text-gray-500">
            {reviewedCount} of {stats.total} reviewed
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {stats.understood > 0 && (
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{
                width: `${(stats.understood / stats.total) * 100}%`,
              }}
            />
          )}
          {stats.partial > 0 && (
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{
                width: `${(stats.partial / stats.total) * 100}%`,
              }}
            />
          )}
          {stats.not_understood > 0 && (
            <div
              className="h-full bg-red-400 transition-all duration-500"
              style={{
                width: `${(stats.not_understood / stats.total) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {stats.understood} understood
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {stats.partial} partial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {stats.not_understood} not understood
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            {stats.unmarked} not reviewed
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <button
          onClick={onGenerateStudyGuide}
          disabled={generatingGuide || reviewedCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium
            hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {generatingGuide ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          {generatingGuide ? "Generating..." : "Generate Study Guide"}
        </button>
        <button
          onClick={onStartQuiz}
          disabled={generatingQuiz}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium
            hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {generatingQuiz ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BrainCircuit className="w-4 h-4" />
          )}
          {generatingQuiz ? "Generating..." : "Start Quiz"}
        </button>
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {sentences.map((sentence, index) => {
          const config = understandingConfig[sentence.understanding];
          const Icon = config.icon;

          return (
            <button
              key={sentence.id}
              onClick={() =>
                updateUnderstanding(
                  sentence.id,
                  cycleUnderstanding(sentence.understanding)
                )
              }
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-200
                ${config.bg} ${config.border} ${config.hover}
                hover:shadow-sm active:scale-[0.995]
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    <span className="text-gray-400 font-mono text-xs mr-2">
                      {index + 1}.
                    </span>
                    {sentence.content}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400 mt-0.5">
                  {config.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
