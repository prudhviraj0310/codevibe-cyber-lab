import { NextResponse } from "next/server";
import { callAI, isConfigured } from "@/utils/ai";

const analysisPrompt = [
  "You are a code security scanner. Analyze the code below and respond in EXACTLY this JSON format, nothing else:",
  '{"type":"<vulnerability type>","severity":"<HIGH or MEDIUM or LOW or NONE>","description":"<one sentence>","fix":"<one sentence>"}',
  "Rules: Respond with ONLY the JSON. severity must be exactly HIGH, MEDIUM, LOW, or NONE.",
].join("\n");

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({ type: "Config Error", severity: "NONE", description: "Add OPENAI_API_KEY to .env.local.", fix: "Set the env variable." });
    }

    const text = await callAI(analysisPrompt + "\n\nCode:\n```\n" + code + "\n```");

    try {
      const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        type: parsed.type || "Unknown",
        severity: parsed.severity || "MEDIUM",
        description: parsed.description || "Potential security issue.",
        fix: parsed.fix || "Review your code.",
      });
    } catch {
      return NextResponse.json({ type: "Unknown", severity: "MEDIUM", description: text.substring(0, 120), fix: "Review your code." });
    }
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
