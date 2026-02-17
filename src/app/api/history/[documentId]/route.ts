import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  const [guidesResult, quizzesResult] = await Promise.all([
    supabase
      .from("study_guides")
      .select("id, document_id, content, created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quizzes")
      .select("id, document_id, created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false }),
  ]);

  if (guidesResult.error || quizzesResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    studyGuides: guidesResult.data,
    quizzes: quizzesResult.data,
  });
}
