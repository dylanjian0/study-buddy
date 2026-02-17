import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  const { data, error } = await supabase
    .from("sentences")
    .select("*")
    .eq("document_id", documentId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const body = await request.json();
  const { sentenceId, sentenceIds, understanding } = body;

  // Bulk update: update multiple sentences at once
  if (sentenceIds && Array.isArray(sentenceIds)) {
    const { error } = await supabase
      .from("sentences")
      .update({ understanding })
      .eq("document_id", documentId)
      .in("id", sentenceIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Single update
  if (sentenceId) {
    const { error } = await supabase
      .from("sentences")
      .update({ understanding })
      .eq("id", sentenceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No sentence ID provided" }, { status: 400 });
}
