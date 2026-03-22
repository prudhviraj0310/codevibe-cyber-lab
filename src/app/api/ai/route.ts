import { NextResponse } from "next/server";
import { callAI, isConfigured } from "@/utils/ai";

const systemPrompt = [
  "You are an AI security mentor for an ethical hacking learning platform called CodeVibe Cyber Lab.",
  "Your job is to help users understand security vulnerabilities in their code.",
  "- Give hints and guidance, not direct answers",
  "- Focus on teaching security concepts",
  "- Be concise and practical",
  "- Use examples when helpful",
].join("\n");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, question } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({
        reply: "⚠️ API key not configured. Add OPENAI_API_KEY to .env.local.",
      });
    }

    const prompt = [
      systemPrompt,
      "",
      code ? "Code:\n```\n" + code + "\n```\n" : "",
      "User question: " + question,
    ].join("\n");

    const reply = await callAI(prompt);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
