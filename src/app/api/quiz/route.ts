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

    const allContent = sentences.map((s: Sentence) => s.content).join("\n");

    const prompt = `Based on the following study material about "${doc?.title || "a topic"}", generate exactly 10 multiple-choice questions to test the student's knowledge.

Study material:
${allContent}

Return your response as a JSON array with exactly this structure:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- Each question must have exactly 4 options
- correct_answer is the 0-based index of the correct option
- Questions should range from easy to challenging
- Cover different aspects of the material
- Make incorrect options plausible but clearly wrong
- Return ONLY the JSON array, no other text`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content || "[]";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse quiz questions" },
        { status: 500 }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({ document_id: documentId })
      .select()
      .single();

    if (quizError) {
      return NextResponse.json(
        { error: "Failed to save quiz" },
        { status: 500 }
      );
    }

    const questionRows = questions.map(
      (
        q: {
          question: string;
          options: string[];
          correct_answer: number;
          explanation: string;
        },
        index: number
      ) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        position: index,
      })
    );

    const { error: qError } = await supabase
      .from("quiz_questions")
      .insert(questionRows);

    if (qError) {
      return NextResponse.json(
        { error: "Failed to save quiz questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quizId: quiz.id,
      questions: questionRows,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
