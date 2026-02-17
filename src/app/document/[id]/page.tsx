"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import SentenceReview from "@/components/SentenceReview";
import StudyGuideView from "@/components/StudyGuideView";
import QuizMode from "@/components/QuizMode";
import { GraduationCap, Home, Loader2 } from "lucide-react";
import { Document, StudyGuide, Quiz } from "@/lib/types";

type View = "review" | "study-guide" | "quiz";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  position: number;
}

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: documentId } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View>("review");
  const [document, setDocument] = useState<Document | null>(null);
  const [studyGuideContent, setStudyGuideContent] = useState<string | null>(
    null
  );
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
    } catch (err) {
      console.error("Failed to fetch document:", err);
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
    } catch (err) {
      console.error("Failed to fetch history:", err);
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
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to generate study guide:", err);
    } finally {
      setGeneratingGuide(false);
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
    } catch (err) {
      console.error("Failed to load quiz:", err);
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
        console.error("Quiz request failed");
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
            if (parsed.error) {
              console.error("Stream error:", parsed.error);
              continue;
            }
            if (parsed.question) {
              setQuizQuestions((prev) => [...prev, parsed]);
            }
          } catch {
            // incomplete JSON line, skip
          }
        }
      }

      setQuizStreaming(false);
      fetchHistory();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to generate quiz:", err);
      }
      setQuizStreaming(false);
      setGeneratingQuiz(false);
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900
              hover:bg-gray-100 rounded-xl transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
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
        {view === "review" && (
          <div className="animate-fade-in">
            <SentenceReview
              documentId={documentId}
              onGenerateStudyGuide={handleGenerateStudyGuide}
              onStartQuiz={handleStartQuiz}
              onViewStudyGuide={handleViewStudyGuide}
              onViewQuiz={handleViewQuiz}
              generatingGuide={generatingGuide}
              generatingQuiz={generatingQuiz}
              savedGuides={savedGuides}
              savedQuizzes={savedQuizzes}
            />
          </div>
        )}
        {view === "study-guide" && studyGuideContent && (
          <div className="animate-fade-in">
            <StudyGuideView
              content={studyGuideContent}
              onBack={() => setView("review")}
            />
          </div>
        )}
        {view === "quiz" && (
          <div className="animate-fade-in">
            <QuizMode
              questions={quizQuestions}
              isStreaming={quizStreaming}
              onBack={() => {
                abortRef.current?.abort();
                setQuizStreaming(false);
                setView("review");
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
