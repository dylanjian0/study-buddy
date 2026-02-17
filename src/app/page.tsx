"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  GraduationCap,
  Upload,
  CheckCircle,
  BookOpen,
  Brain,
  Zap,
  ArrowRight,
  Star,
  ChevronRight,
  Sparkles,
  BarChart3,
  FileText,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // If already signed in, go straight to dashboard
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <span className="font-bold text-gray-900 text-lg">StudyBuddy</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl
                hover:bg-gray-50 transition-colors font-medium"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-semibold px-4 py-2 rounded-xl
                bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm
                hover:shadow-indigo-200 hover:shadow-md"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px]
          bg-gradient-to-b from-indigo-100/70 via-violet-100/40 to-transparent
          rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100
            text-indigo-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered personalized learning
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6">
            Study smarter.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Remember more.
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload any PDF, mark what you understand, and get a personalized
            study guide and quiz — tailored exactly to your gaps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="group w-full sm:w-auto flex items-center justify-center gap-2
                px-7 py-3.5 rounded-xl text-base font-semibold text-white
                bg-gradient-to-r from-indigo-600 to-violet-600
                hover:from-indigo-700 hover:to-violet-700
                shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200
                transition-all"
            >
              Start studying for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-sm text-gray-400">
              Free · No credit card required
            </p>
          </div>
        </div>

        {/* Product preview card */}
        <div className="max-w-4xl mx-auto mt-16 relative">
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 overflow-hidden bg-white">
            {/* Fake browser bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-md h-5 max-w-xs mx-auto" />
              </div>
            </div>
            {/* UI preview */}
            <div className="p-6 bg-gray-50">
              <div className="flex gap-4">
                {/* Sidebar mock */}
                <div className="hidden sm:flex flex-col gap-2 w-48 shrink-0">
                  {["Introduction", "Chapter 1", "Key Concepts", "Summary"].map(
                    (label, i) => (
                      <div
                        key={label}
                        className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                          i === 1
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        {label}
                      </div>
                    )
                  )}
                </div>
                {/* Main area mock */}
                <div className="flex-1 space-y-3">
                  {[
                    { color: "bg-green-100 border-green-300", label: "Understood", text: "Mitochondria produce ATP through cellular respiration." },
                    { color: "bg-yellow-100 border-yellow-300", label: "Partial", text: "The electron transport chain involves a series of protein complexes embedded in the inner mitochondrial membrane." },
                    { color: "bg-red-100 border-red-300", label: "Not understood", text: "Chemiosmosis drives ATP synthase via the proton gradient across the inner membrane." },
                    { color: "bg-green-100 border-green-300", label: "Understood", text: "Glycolysis breaks down glucose into two pyruvate molecules in the cytoplasm." },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border ${item.color} px-4 py-3 flex items-start gap-3`}
                    >
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        item.label === "Understood" ? "bg-green-500" :
                        item.label === "Partial" ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -left-4 top-1/3 hidden lg:flex items-center gap-2
            bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">3 concepts mastered</p>
              <p className="text-[10px] text-gray-400">Keep it up!</p>
            </div>
          </div>
          <div className="absolute -right-4 bottom-1/4 hidden lg:flex items-center gap-2
            bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Quiz ready</p>
              <p className="text-[10px] text-gray-400">10 questions generated</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to ace your exams
            </h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto">
              Stop passively re-reading. Actively engage with your material using AI that adapts to you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                color: "bg-indigo-100 text-indigo-600",
                title: "Instant PDF Processing",
                desc: "Upload any PDF and we extract every concept into reviewable sentences in seconds.",
              },
              {
                icon: CheckCircle,
                color: "bg-green-100 text-green-600",
                title: "Understanding Tracker",
                desc: "Mark each sentence as understood, partial, or not understood with a single click.",
              },
              {
                icon: BookOpen,
                color: "bg-violet-100 text-violet-600",
                title: "Personalized Study Guide",
                desc: "AI writes a guide that spends more time on your gaps and less on what you already know.",
              },
              {
                icon: Brain,
                color: "bg-purple-100 text-purple-600",
                title: "Adaptive Quiz Mode",
                desc: "10-question multiple choice quiz generated from your actual material — streams in live.",
              },
              {
                icon: BarChart3,
                color: "bg-blue-100 text-blue-600",
                title: "Progress History",
                desc: "All your previous study guides and quizzes are saved and instantly accessible.",
              },
              {
                icon: Zap,
                color: "bg-yellow-100 text-yellow-600",
                title: "Lightning Fast",
                desc: "Quiz questions stream in as they're generated — no waiting for the full response.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Three steps to mastery
            </h2>
            <p className="text-lg text-gray-500">
              From raw PDF to personalized quiz in minutes.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                num: "01",
                color: "from-indigo-500 to-indigo-600",
                bg: "bg-indigo-50",
                title: "Upload your study material",
                desc: "Drop in any PDF — textbook chapter, lecture notes, research paper. We extract and parse every sentence automatically.",
                icon: Upload,
              },
              {
                num: "02",
                color: "from-violet-500 to-violet-600",
                bg: "bg-violet-50",
                title: "Review and rate your understanding",
                desc: "Go through each sentence and mark it green (understood), yellow (partial), or red (not understood). Bulk-select to move fast.",
                icon: CheckCircle,
              },
              {
                num: "03",
                color: "from-purple-500 to-purple-600",
                bg: "bg-purple-50",
                title: "Learn with your personalized guide & quiz",
                desc: "Generate a study guide weighted toward your weakest areas, then take a quiz to confirm what you've learned.",
                icon: Brain,
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`${step.bg} rounded-2xl p-8 flex flex-col sm:flex-row items-start gap-6`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">
                    Step {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden sm:block w-5 h-5 text-gray-300 self-center" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-500 text-sm">Loved by students worldwide</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "I went from dreading exams to feeling genuinely prepared. The personalized study guide hits exactly what I need.",
                name: "Sarah K.",
                role: "Pre-med student",
              },
              {
                quote: "The quiz mode is incredible. Questions show up as they generate — I'm doing practice problems in seconds, not minutes.",
                name: "Marcus T.",
                role: "Computer Science major",
              },
              {
                quote: "I upload my lecture notes right after class and review them the same day. My retention has improved massively.",
                name: "Priya M.",
                role: "Law student",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600
            flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Join students who are turning their study time into real results.
            It&apos;s free to start.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl
              text-base font-semibold text-white
              bg-gradient-to-r from-indigo-600 to-violet-600
              hover:from-indigo-700 hover:to-violet-700
              shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300
              transition-all"
          >
            Get started for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-gray-400">Sign in with Google · No credit card needed</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-700 text-sm">StudyBuddy</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} StudyBuddy. AI-powered studying.
          </p>
        </div>
      </footer>
    </div>
  );
}
