"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SentenceReview from "@/components/SentenceReview";
import StudyGuideView from "@/components/StudyGuideView";
import QuizMode from "@/components/QuizMode";
import UserMenu from "@/components/UserMenu";
import { GraduationCap, Home, Trash2 } from "lucide-react";
import { Document, StudyGuide, Quiz } from "@/lib/types";

type View = "review" | "study-guide" | "quiz";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  position: number;
}

const viewTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: documentId } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View>("review");
  const [document, setDocument] = useState<Document | null>(null);
  const [studyGuideContent, setStudyGuideContent] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizStreaming, setQuizStreaming] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedGuides, setSavedGuides] = useState<StudyGuide[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchDocument();
    fetchHistory();
    return () => {
      abortRef.current?.abort();
    };
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const res = await fetch("/api/documents");
      const docs = await res.json();
      const doc = docs.find((d: Document) => d.id === documentId);
      setDocument(doc || null);
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/history/${documentId}`);
      const data = await res.json();
      if (data.studyGuides) setSavedGuides(data.studyGuides);
      if (data.quizzes) setSavedQuizzes(data.quizzes);
    } catch {
      // silent
    }
  };

  const handleGenerateStudyGuide = async () => {
    setGeneratingGuide(true);
    try {
      const res = await fetch("/api/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (data.content) {
        setStudyGuideContent(data.content);
        setView("study-guide");
        toast.success("Study guide ready!");
        fetchHistory();
      } else {
        toast.error("Failed to generate study guide");
      }
    } catch {
      toast.error("Failed to generate study guide");
    } finally {
      setGeneratingGuide(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (
      !confirm(
        "Delete this document and all its study guides, quizzes, and data?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (res.ok) {
        toast.success("Document deleted");
        router.push("/dashboard");
      } else {
        toast.error("Failed to delete document");
      }
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleViewStudyGuide = (guide: StudyGuide) => {
    setStudyGuideContent(guide.content);
    setView("study-guide");
  };

  const handleViewQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quiz/${quizId}`);
      const questions = await res.json();
      if (Array.isArray(questions) && questions.length > 0) {
        setQuizQuestions(
          questions.map((q: QuizQuestion) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            position: q.position,
          }))
        );
        setQuizStreaming(false);
        setView("quiz");
      }
    } catch {
      toast.error("Failed to load quiz");
    }
  };

  const handleStartQuiz = useCallback(async () => {
    setGeneratingQuiz(true);
    setQuizQuestions([]);
    setQuizStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        toast.error("Failed to start quiz");
        setGeneratingQuiz(false);
        setQuizStreaming(false);
        return;
      }

      setView("quiz");
      setGeneratingQuiz(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            setQuizStreaming(false);
            fetchHistory();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) continue;
            if (parsed.question) {
              setQuizQuestions((prev) => [...prev, parsed]);
            }
          } catch {
            // incomplete JSON
          }
        }
      }

      setQuizStreaming(false);
      fetchHistory();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Failed to generate quiz");
      }
      setQuizStreaming(false);
      setGeneratingQuiz(false);
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-3 w-48" />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-28 w-full" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StudyBuddy</h1>
              {document && (
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  {document.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteDocument}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-600
                hover:bg-red-50 rounded-xl transition-colors text-sm"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900
                hover:bg-gray-100 rounded-xl transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      {view === "review" && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-1 py-2">
              <span className="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
                Review Sentences
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === "review" && (
            <motion.div key="review" {...viewTransition}>
              <SentenceReview
                documentId={documentId}
                documentTitle={document?.title}
                onGenerateStudyGuide={handleGenerateStudyGuide}
                onStartQuiz={handleStartQuiz}
                onViewStudyGuide={handleViewStudyGuide}
                onViewQuiz={handleViewQuiz}
                generatingGuide={generatingGuide}
                generatingQuiz={generatingQuiz}
                savedGuides={savedGuides}
                savedQuizzes={savedQuizzes}
              />
            </motion.div>
          )}
          {view === "study-guide" && studyGuideContent && (
            <motion.div key="guide" {...viewTransition}>
              <StudyGuideView
                content={studyGuideContent}
                onBack={() => setView("review")}
              />
            </motion.div>
          )}
          {view === "quiz" && (
            <motion.div key="quiz" {...viewTransition}>
              <QuizMode
                questions={quizQuestions}
                isStreaming={quizStreaming}
                onBack={() => {
                  abortRef.current?.abort();
                  setQuizStreaming(false);
                  setView("review");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
