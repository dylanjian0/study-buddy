import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify document belongs to user
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
