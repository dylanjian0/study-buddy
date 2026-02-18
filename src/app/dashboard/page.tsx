"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PDFUpload from "@/components/PDFUpload";
import UserMenu from "@/components/UserMenu";
import {
  GraduationCap,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Brain,
  TrendingUp,
  BookOpen,
  Upload,
} from "lucide-react";

interface DocStat {
  id: string;
  title: string;
  created_at: string;
  total: number;
  understood: number;
  partial: number;
  notUnderstood: number;
}

interface Analytics {
  totalDocuments: number;
  totalSentences: number;
  understood: number;
  partial: number;
  notUnderstood: number;
  masteryPercent: number;
  totalGuides: number;
  totalQuizzes: number;
  recentDocument: DocStat | null;
  documentStats: DocStat[];
}

function AnimatedNumber({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <>{display}</>;
}

function ProgressRing({
  understood,
  partial,
  notUnderstood,
  size = 48,
  stroke = 5,
}: {
  understood: number;
  partial: number;
  notUnderstood: number;
  size?: number;
  stroke?: number;
}) {
  const total = understood + partial + notUnderstood;
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - stroke) / 2}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const understoodLen = (understood / total) * circumference;
  const partialLen = (partial / total) * circumference;
  const notUnderstoodLen = (notUnderstood / total) * circumference;

  const understoodOffset = 0;
  const partialOffset = understoodLen;
  const notUnderstoodOffset = understoodLen + partialLen;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      {notUnderstood > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f87171"
          strokeWidth={stroke}
          strokeDasharray={`${notUnderstoodLen} ${circumference - notUnderstoodLen}`}
          strokeDashoffset={-notUnderstoodOffset}
          strokeLinecap="round"
        />
      )}
      {partial > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={stroke}
          strokeDasharray={`${partialLen} ${circumference - partialLen}`}
          strokeDashoffset={-partialOffset}
          strokeLinecap="round"
        />
      )}
      {understood > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#34d399"
          strokeWidth={stroke}
          strokeDasharray={`${understoodLen} ${circumference - understoodLen}`}
          strokeDashoffset={-understoodOffset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

export default function Dashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch analytics and user info
      const [analyticsRes] = await Promise.all([
        fetch("/api/analytics"),
      ]);
      const data = await analyticsRes.json();
      if (!data.error) setAnalytics(data);

      // Get user name from supabase browser client
      const { createClient } = await import("@/lib/supabase-browser");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "there";
        setUserName(name.split(" ")[0]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (documentId: string) => {
    router.push(`/document/${documentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton h-6 w-32" />
            </div>
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="skeleton h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-40 w-full rounded-2xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const isEmpty = !analytics || analytics.totalDocuments === 0;

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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Welcome Banner */}
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {userName || "there"}
            </h2>
            <p className="text-gray-500 mt-1">
              {isEmpty
                ? "Upload your first study material to get started."
                : "Here's an overview of your study progress."}
            </p>
          </motion.div>

          {isEmpty ? (
            /* ── Empty State ── */
            <motion.div variants={fadeUp}>
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start your study journey
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  Upload a PDF of your study material. We&apos;ll break it down into sentences
                  so you can track your understanding and generate personalized study aids.
                </p>
                <PDFUpload onUploadComplete={handleUploadComplete} />
              </div>

              {/* How it works */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Upload PDF", desc: "Upload your study material and we'll extract the key sentences.", color: "from-indigo-500 to-indigo-600" },
                  { step: "2", title: "Mark Understanding", desc: "Review each sentence and mark it as understood, partial, or not understood.", color: "from-violet-500 to-violet-600" },
                  { step: "3", title: "Learn & Quiz", desc: "Get a personalized study guide and take a quiz to test your knowledge.", color: "from-purple-500 to-purple-600" },
                ].map((item) => (
                  <motion.div key={item.step} variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm mb-4`}>
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── Analytics Dashboard ── */
            <>
              {/* Stats Grid */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Documents",
                    value: analytics!.totalDocuments,
                    icon: FileText,
                    color: "bg-indigo-100 text-indigo-600",
                  },
                  {
                    label: "Sentences",
                    value: analytics!.totalSentences,
                    icon: CheckCircle2,
                    color: "bg-emerald-100 text-emerald-600",
                  },
                  {
                    label: "Mastery",
                    value: analytics!.masteryPercent,
                    suffix: "%",
                    icon: TrendingUp,
                    color: "bg-violet-100 text-violet-600",
                  },
                  {
                    label: "Quizzes",
                    value: analytics!.totalQuizzes,
                    icon: Brain,
                    color: "bg-purple-100 text-purple-600",
                  },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      <AnimatedNumber value={stat.value} />
                      {stat.suffix || ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Continue Studying + Upload Row */}
              <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Continue Card */}
                {analytics!.recentDocument && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => router.push(`/document/${analytics!.recentDocument!.id}`)}
                    className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">
                          Continue studying
                        </p>
                        <h3 className="text-white font-bold text-lg truncate mb-2">
                          {analytics!.recentDocument.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-indigo-200">
                            {analytics!.recentDocument.total} sentences
                          </span>
                          <span className="text-emerald-300">
                            {analytics!.recentDocument.total > 0
                              ? Math.round((analytics!.recentDocument.understood / analytics!.recentDocument.total) * 100)
                              : 0}% mastered
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <ProgressRing
                          understood={analytics!.recentDocument.understood}
                          partial={analytics!.recentDocument.partial}
                          notUnderstood={analytics!.recentDocument.notUnderstood}
                          size={56}
                          stroke={5}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-200 text-xs mt-4 group-hover:text-white transition-colors">
                      Resume
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.button>
                )}

                {/* Upload New */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <BookOpen className="w-[18px] h-[18px] text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Upload new material</p>
                      <p className="text-xs text-gray-400">PDF files supported</p>
                    </div>
                  </div>
                  <PDFUpload onUploadComplete={handleUploadComplete} />
                </div>
              </motion.div>

              {/* Document Cards */}
              {analytics!.documentStats.length > 0 && (
                <motion.div variants={fadeUp}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    All Documents
                  </h3>
                  <motion.div
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                  >
                    {analytics!.documentStats.map((doc) => (
                      <motion.button
                        key={doc.id}
                        variants={fadeUp}
                        whileHover={{ y: -3 }}
                        onClick={() => router.push(`/document/${doc.id}`)}
                        className="bg-white rounded-xl border border-gray-200 p-4 text-left
                          hover:border-indigo-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <ProgressRing
                            understood={doc.understood}
                            partial={doc.partial}
                            notUnderstood={doc.notUnderstood}
                            size={44}
                            stroke={4}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {doc.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {doc.total} sentences
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors mt-1" />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
