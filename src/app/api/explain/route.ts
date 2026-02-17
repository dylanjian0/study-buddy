import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { sentenceContent, documentTitle } = await request.json();

    if (!sentenceContent) {
      return new Response(
        JSON.stringify({ error: "No sentence provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert tutor. A student is studying "${documentTitle || "a topic"}" and wants to understand this sentence:

"${sentenceContent}"

Give a clear, concise explanation in 3-5 sentences that:
1. Explains the concept in plain English
2. Mentions why this matters or how it connects to the broader topic
3. Gives a brief concrete example if applicable

Be direct and helpful. Do not use markdown formatting, just plain text paragraphs.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Explain stream error:", err);
          controller.enqueue(
            encoder.encode(`data: [ERROR]\n\n`)
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
    console.error("Explain error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate explanation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
