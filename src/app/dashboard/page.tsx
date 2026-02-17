"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PDFUpload from "@/components/PDFUpload";
import UserMenu from "@/components/UserMenu";
import {
  GraduationCap,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Document } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (documentId: string) => {
    router.push(`/document/${documentId}`);
  };

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
              <p className="text-xs text-gray-500">AI-Powered Study Assistant</p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Personalized learning powered by AI
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Study smarter, not harder
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Upload your study material, mark what you understand, and get a
            personalized study guide and practice quiz.
          </p>
        </div>

        {/* Upload */}
        <div className="mb-16 animate-fade-in">
          <PDFUpload onUploadComplete={handleUploadComplete} />
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h3 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Upload PDF",
                desc: "Upload your study material and we'll extract the key sentences.",
                color: "from-indigo-500 to-indigo-600",
              },
              {
                step: "2",
                title: "Mark Understanding",
                desc: "Review each sentence and mark it as understood, partial, or not understood.",
                color: "from-violet-500 to-violet-600",
              },
              {
                step: "3",
                title: "Learn & Quiz",
                desc: "Get a personalized study guide and take a quiz to test your knowledge.",
                color: "from-purple-500 to-purple-600",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm mb-4`}
                >
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Previous Documents */}
        {!loading && documents.length > 0 && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Previous Documents
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left
                    hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
