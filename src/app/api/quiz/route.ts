import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { openai } from "@/lib/openai";
import { Sentence } from "@/lib/types";

interface ParsedQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

function extractCompleteQuestions(partial: string): {
  questions: ParsedQuestion[];
  remaining: string;
} {
  const questions: ParsedQuestion[] = [];
  let remaining = partial;

  // Find the start of the array
  const arrStart = remaining.indexOf("[");
  if (arrStart === -1) return { questions: [], remaining };
  remaining = remaining.slice(arrStart + 1);

  // Try to extract complete JSON objects
  let depth = 0;
  let objStart = -1;

  for (let i = 0; i < remaining.length; i++) {
    const ch = remaining[i];
    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const objStr = remaining.slice(objStart, i + 1);
        try {
          const obj = JSON.parse(objStr);
          if (obj.question && obj.options && typeof obj.correct_answer === "number") {
            questions.push(obj);
          }
        } catch {
          // incomplete JSON, skip
        }
        remaining = remaining.slice(i + 1);
        i = -1; // restart scanning from the new remaining
        objStart = -1;
      }
    }
  }

  return { questions, remaining };
}

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    const { data: sentences, error } = await supabase
      .from("sentences")
      .select("*")
      .eq("document_id", documentId)
      .order("position", { ascending: true });

    if (error || !sentences) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch sentences" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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

    // Create quiz record upfront
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({ document_id: documentId })
      .select()
      .single();

    if (quizError) {
      return new Response(
        JSON.stringify({ error: "Failed to save quiz" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
      stream: true,
    });

    let accumulated = "";
    let questionsSentSoFar = 0;

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            accumulated += delta;

            const { questions } = extractCompleteQuestions(accumulated);

            // Send any new questions we haven't sent yet
            while (questionsSentSoFar < questions.length) {
              const q = questions[questionsSentSoFar];
              const questionData = {
                question: q.question,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                position: questionsSentSoFar,
              };

              // Save to Supabase in background
              supabase
                .from("quiz_questions")
                .insert({
                  quiz_id: quiz.id,
                  ...questionData,
                })
                .then();

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(questionData)}\n\n`)
              );
              questionsSentSoFar++;
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate quiz" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
