import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all user documents
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!documents || documents.length === 0) {
    return NextResponse.json({
      totalDocuments: 0,
      totalSentences: 0,
      understood: 0,
      partial: 0,
      notUnderstood: 0,
      masteryPercent: 0,
      totalGuides: 0,
      totalQuizzes: 0,
      recentDocument: null,
      documentStats: [],
    });
  }

  const docIds = documents.map((d) => d.id);

  // Fetch all sentences for user's documents
  const { data: sentences } = await supabase
    .from("sentences")
    .select("document_id, understanding")
    .in("document_id", docIds);

  // Fetch counts
  const { count: guidesCount } = await supabase
    .from("study_guides")
    .select("id", { count: "exact", head: true })
    .in("document_id", docIds);

  const { count: quizzesCount } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .in("document_id", docIds);

  // Find most recent activity
  const { data: recentGuide } = await supabase
    .from("study_guides")
    .select("document_id, created_at")
    .in("document_id", docIds)
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: recentQuiz } = await supabase
    .from("quizzes")
    .select("document_id, created_at")
    .in("document_id", docIds)
    .order("created_at", { ascending: false })
    .limit(1);

  // Calculate global stats
  const allSentences = sentences || [];
  const understood = allSentences.filter((s) => s.understanding === "understood").length;
  const partial = allSentences.filter((s) => s.understanding === "partial").length;
  const notUnderstood = allSentences.filter((s) => s.understanding === "not_understood").length;
  const total = allSentences.length;
  const masteryPercent = total > 0 ? Math.round((understood / total) * 100) : 0;

  // Per-document stats
  const documentStats = documents.map((doc) => {
    const docSentences = allSentences.filter((s) => s.document_id === doc.id);
    const docTotal = docSentences.length;
    const docUnderstood = docSentences.filter((s) => s.understanding === "understood").length;
    const docPartial = docSentences.filter((s) => s.understanding === "partial").length;
    const docNotUnderstood = docSentences.filter((s) => s.understanding === "not_understood").length;

    return {
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      total: docTotal,
      understood: docUnderstood,
      partial: docPartial,
      notUnderstood: docNotUnderstood,
    };
  });

  // Determine most recently active document
  let recentDocId: string | null = null;
  let recentTime = "";

  if (recentGuide?.[0]) {
    recentDocId = recentGuide[0].document_id;
    recentTime = recentGuide[0].created_at;
  }
  if (recentQuiz?.[0] && recentQuiz[0].created_at > recentTime) {
    recentDocId = recentQuiz[0].document_id;
  }

  const recentDocument = recentDocId
    ? documentStats.find((d) => d.id === recentDocId) || null
    : documentStats[0] || null;

  return NextResponse.json({
    totalDocuments: documents.length,
    totalSentences: total,
    understood,
    partial,
    notUnderstood,
    masteryPercent,
    totalGuides: guidesCount || 0,
    totalQuizzes: quizzesCount || 0,
    recentDocument,
    documentStats,
  });
}
