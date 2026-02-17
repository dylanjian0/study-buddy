import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function splitIntoSentences(text: string): string[] {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const sentences = cleaned
    .split(/(?<=[.!?])\s+|(?<=\n\n)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic require to avoid Turbopack ESM bundling issues with pdf-parse v1
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(buffer);

    const sentences = splitIntoSentences(pdfData.text);

    if (sentences.length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    const title = file.name.replace(/\.pdf$/i, "");
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ title, original_filename: file.name })
      .select()
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      return NextResponse.json(
        { error: "Failed to save document" },
        { status: 500 }
      );
    }

    const sentenceRows = sentences.map((content: string, index: number) => ({
      document_id: doc.id,
      content,
      position: index,
      understanding: "not_understood",
    }));

    const { error: sentError } = await supabase
      .from("sentences")
      .insert(sentenceRows);

    if (sentError) {
      console.error("Sentences insert error:", sentError);
      return NextResponse.json(
        { error: "Failed to save sentences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documentId: doc.id,
      sentenceCount: sentences.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
