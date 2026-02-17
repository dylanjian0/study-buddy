import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { openai } from "@/lib/openai";
import { Sentence } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    const { data: sentences, error } = await supabase
      .from("sentences")
      .select("*")
      .eq("document_id", documentId)
      .order("position", { ascending: true });

    if (error || !sentences) {
      return NextResponse.json(
        { error: "Failed to fetch sentences" },
        { status: 500 }
      );
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("title")
      .eq("id", documentId)
      .single();

    const categorized = {
      not_understood: sentences.filter(
        (s: Sentence) => s.understanding === "not_understood"
      ),
      partial: sentences.filter(
        (s: Sentence) => s.understanding === "partial"
      ),
      understood: sentences.filter(
        (s: Sentence) => s.understanding === "understood"
      ),
    };

    const prompt = `You are an expert tutor creating a personalized study guide. The student has been studying "${doc?.title || "a topic"}" and has marked their understanding of each concept.

Here are the concepts they DO NOT understand (give these the MOST attention and explanation):
${categorized.not_understood.map((s: Sentence) => `- ${s.content}`).join("\n") || "None"}

Here are concepts they PARTIALLY understand (give moderate attention):
${categorized.partial.map((s: Sentence) => `- ${s.content}`).join("\n") || "None"}

Here are concepts they already understand (briefly review):
${categorized.understood.map((s: Sentence) => `- ${s.content}`).join("\n") || "None"}

Create a comprehensive, well-structured study guide in Markdown format that:
1. Starts with concepts the student doesn't understand, providing detailed explanations with examples
2. Then covers partially understood concepts with clarifying explanations
3. Briefly reviews understood concepts as reinforcement
4. Includes key takeaways and a summary at the end
5. Uses clear headings, bullet points, and examples throughout

Make the guide encouraging and student-friendly. Focus heavily on what they struggle with.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const guideContent = completion.choices[0].message.content || "";

    const { data: guide, error: guideError } = await supabase
      .from("study_guides")
      .insert({ document_id: documentId, content: guideContent })
      .select()
      .single();

    if (guideError) {
      return NextResponse.json(
        { error: "Failed to save study guide" },
        { status: 500 }
      );
    }

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Study guide error:", error);
    return NextResponse.json(
      { error: "Failed to generate study guide" },
      { status: 500 }
    );
  }
}
