"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  ListChecks,
  CheckSquare,
  Square,
  Clock,
  FileText,
  HelpCircle,
  Lightbulb,
  X,
} from "lucide-react";
import { Sentence, Understanding, StudyGuide, Quiz } from "@/lib/types";

interface SentenceReviewProps {
  documentId: string;
  documentTitle?: string;
  onGenerateStudyGuide: () => void;
  onStartQuiz: () => void;
  onViewStudyGuide: (guide: StudyGuide) => void;
  onViewQuiz: (quizId: string) => void;
  generatingGuide: boolean;
  generatingQuiz: boolean;
  savedGuides: StudyGuide[];
  savedQuizzes: Quiz[];
}

const understandingConfig: Record<
  Understanding,
  {
    bg: string;
    border: string;
    hover: string;
    icon: typeof CheckCircle2;
    iconColor: string;
    label: string;
  }
> = {
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

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.03 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

export default function SentenceReview({
  documentId,
  documentTitle,
  onGenerateStudyGuide,
  onStartQuiz,
  onViewStudyGuide,
  onViewQuiz,
  generatingGuide,
  generatingQuiz,
  savedGuides,
  savedQuizzes,
}: SentenceReviewProps) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHelp, setExpandedHelp] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Explainer state
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
  const [explanationCache, setExplanationCache] = useState<Map<string, string>>(new Map());
  const [explaining, setExplaining] = useState(false);
  const explainAbortRef = useRef<AbortController | null>(null);

  const fetchSentences = useCallback(async () => {
    try {
      const res = await fetch(`/api/sentences/${documentId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSentences(data);
    } catch {
      toast.error("Failed to load sentences");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchSentences();
  }, [fetchSentences]);

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
    } catch {
      toast.error("Failed to update understanding");
    }
  };

  const bulkUpdateUnderstanding = async (
    ids: string[],
    understanding: Understanding
  ) => {
    setSentences((prev) =>
      prev.map((s) =>
        ids.includes(s.id) ? { ...s, understanding } : s
      )
    );

    try {
      await fetch(`/api/sentences/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentenceIds: ids, understanding }),
      });
      toast.success(`Marked ${ids.length} sentences as ${understanding.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update sentences");
    }
  };

  const cycleUnderstanding = (current: Understanding): Understanding => {
    const cycle: Understanding[] = ["not_understood", "understood", "partial"];
    const idx = cycle.indexOf(current);
    if (idx === -1) return "understood";
    return cycle[(idx + 1) % cycle.length];
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = (understanding: Understanding) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkUpdateUnderstanding(ids, understanding);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleSelectAll = (understanding: Understanding) => {
    const allIds = sentences.map((s) => s.id);
    bulkUpdateUnderstanding(allIds, understanding);
  };

  // Explainer
  const handleExplain = useCallback(async (sentence: Sentence) => {
    if (expandedExplainId === sentence.id) {
      setExpandedExplainId(null);
      return;
    }

    setExpandedExplainId(sentence.id);

    if (explanationCache.has(sentence.id)) return;

    setExplaining(true);
    explainAbortRef.current?.abort();
    const controller = new AbortController();
    explainAbortRef.current = controller;

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentenceId: sentence.id,
          sentenceContent: sentence.content,
          documentTitle: documentTitle || "Study Material",
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          accumulated += data;
          setExplanationCache((prev) => new Map(prev).set(sentence.id, accumulated));
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Failed to generate explanation");
        setExpandedExplainId(null);
      }
    } finally {
      setExplaining(false);
    }
  }, [expandedExplainId, explanationCache, documentTitle]);

  const stats = {
    total: sentences.length,
    understood: sentences.filter((s) => s.understanding === "understood").length,
    partial: sentences.filter((s) => s.understanding === "partial").length,
    not_understood: sentences.filter((s) => s.understanding === "not_understood").length,
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Skeleton loading */}
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-12 w-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
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
        <AnimatePresence>
          {expandedHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-600 mb-3">
                  Click on each sentence to cycle through understanding levels.
                  Click the <Lightbulb className="w-3.5 h-3.5 inline text-amber-500" /> icon
                  to get an AI explanation.
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">Not understood</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700">Understood</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700">Partial</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
        className="mb-6 bg-white rounded-xl border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Understanding Breakdown
          </span>
          <span className="text-sm text-gray-500">
            {stats.total} sentences total
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: stats.total ? `${(stats.understood / stats.total) * 100}%` : "0%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
          />
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: stats.total ? `${(stats.partial / stats.total) * 100}%` : "0%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
          />
          <motion.div
            className="h-full bg-red-400"
            initial={{ width: 0 }}
            animate={{ width: stats.total ? `${(stats.not_understood / stats.total) * 100}%` : "0%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
          />
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
        </div>
      </motion.div>

      {/* Action Buttons + Saved Items */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="mb-6 bg-white rounded-xl border border-gray-200 p-4"
      >
        <div className="flex gap-3 flex-wrap mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGenerateStudyGuide}
            disabled={generatingGuide}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium
              hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {generatingGuide ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <BookOpen className="w-4 h-4" />
              </motion.div>
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            {generatingGuide ? "Generating..." : "New Study Guide"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartQuiz}
            disabled={generatingQuiz}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium
              hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {generatingQuiz ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <BrainCircuit className="w-4 h-4" />
              </motion.div>
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            {generatingQuiz ? "Generating..." : "New Quiz"}
          </motion.button>
        </div>

        {/* Saved Study Guides */}
        {savedGuides.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Saved Study Guides
            </p>
            <div className="flex flex-wrap gap-2">
              {savedGuides.map((guide, i) => (
                <motion.button
                  key={guide.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onViewStudyGuide(guide)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                    bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-sm group"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                  <span className="text-gray-700 group-hover:text-indigo-700 font-medium">
                    Guide #{savedGuides.length - i}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(guide.created_at).toLocaleDateString()}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Quizzes */}
        {savedQuizzes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Saved Quizzes
            </p>
            <div className="flex flex-wrap gap-2">
              {savedQuizzes.map((quiz, i) => (
                <motion.button
                  key={quiz.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onViewQuiz(quiz.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                    bg-gray-50 hover:bg-violet-50 hover:border-violet-200 transition-colors text-sm group"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500" />
                  <span className="text-gray-700 group-hover:text-violet-700 font-medium">
                    Quiz #{savedQuizzes.length - i}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {savedGuides.length === 0 && savedQuizzes.length === 0 && (
          <p className="text-xs text-gray-400">
            No saved study guides or quizzes yet. Generate one above!
          </p>
        )}
      </motion.div>

      {/* Selection & Bulk Actions Toolbar - Sticky */}
      <div className="sticky top-[73px] z-40 mb-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectMode
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              {selectMode ? "Cancel selection" : "Select multiple"}
            </button>

            <AnimatePresence>
              {selectMode && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1"
                >
                  <span className="text-xs text-gray-400">
                    {selectedIds.size} selected
                  </span>
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-gray-500 mr-1">
                        Mark as:
                      </span>
                      <button
                        onClick={() => handleBulkAction("understood")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        Understood
                      </button>
                      <button
                        onClick={() => handleBulkAction("partial")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        Partial
                      </button>
                      <button
                        onClick={() => handleBulkAction("not_understood")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Not understood
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">All sentences:</span>
            <button
              onClick={() => handleSelectAll("understood")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              All understood
            </button>
            <button
              onClick={() => handleSelectAll("not_understood")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
            >
              All not understood
            </button>
          </div>
        </div>
      </div>

      {/* Sentences */}
      <motion.div
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {sentences.map((sentence, index) => {
          const understanding: Understanding =
            sentence.understanding in understandingConfig
              ? sentence.understanding
              : "not_understood";
          const config = understandingConfig[understanding];
          const Icon = config.icon;
          const isSelected = selectedIds.has(sentence.id);
          const isExplainOpen = expandedExplainId === sentence.id;
          const cachedExplanation = explanationCache.get(sentence.id);

          return (
            <motion.div key={sentence.id} variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.995 }}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(sentence.id);
                  } else {
                    updateUnderstanding(
                      sentence.id,
                      cycleUnderstanding(sentence.understanding)
                    );
                  }
                }}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all duration-200 group/sentence
                  ${config.bg} ${config.border} ${config.hover}
                  hover:shadow-sm
                  ${selectMode && isSelected ? "ring-2 ring-indigo-400" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  {selectMode ? (
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm leading-relaxed">
                      <span className="text-gray-400 font-mono text-xs mr-2">
                        {index + 1}.
                      </span>
                      {sentence.content}
                    </p>
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExplain(sentence);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isExplainOpen
                            ? "bg-amber-100 text-amber-600"
                            : "opacity-0 group-hover/sentence:opacity-100 hover:bg-amber-100 text-gray-400 hover:text-amber-600"
                        }`}
                        title="Explain this sentence"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400">
                        {config.label}
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>

              {/* Explain Panel */}
              <AnimatePresence>
                {isExplainOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-8 mt-1 mb-2 p-4 bg-indigo-50 border border-indigo-200 rounded-xl relative">
                      <button
                        onClick={() => setExpandedExplainId(null)}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 pr-4">
                          {cachedExplanation ? (
                            <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                              {cachedExplanation}
                            </p>
                          ) : explaining ? (
                            <div className="flex items-center gap-1.5">
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                              />
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                              />
                              <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-indigo-400">Loading...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
