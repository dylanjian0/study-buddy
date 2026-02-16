"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import SentenceReview from "@/components/SentenceReview";
import StudyGuideView from "@/components/StudyGuideView";
import QuizMode from "@/components/QuizMode";
import { GraduationCap, Home, Loader2 } from "lucide-react";
import { Document } from "@/lib/types";

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
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(
    null
  );
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
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
      }
    } catch (err) {
      console.error("Failed to generate study guide:", err);
    } finally {
      setGeneratingGuide(false);
    }
  };

  const handleStartQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuizQuestions(data.questions);
        setView("quiz");
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setGeneratingQuiz(false);
    }
  };

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
              generatingGuide={generatingGuide}
              generatingQuiz={generatingQuiz}
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
        {view === "quiz" && quizQuestions && (
          <div className="animate-fade-in">
            <QuizMode
              questions={quizQuestions}
              onBack={() => setView("review")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
