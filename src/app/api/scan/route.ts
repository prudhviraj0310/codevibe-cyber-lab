import { NextResponse } from "next/server";
import { callAI, isConfigured } from "@/utils/ai";

const scanPrompt = [
  "You are a security code scanner. Analyze the following code and return a JSON object with ALL vulnerabilities found.",
  "",
  "Response MUST be valid JSON in this exact format:",
  '{"vulnerabilities":[{"type":"SQL Injection","severity":"HIGH","line":7,"description":"Unsafe string concatenation in SQL query","fix":"Use parameterized queries","fixedCode":"const query = db.execute(\\"SELECT * FROM users WHERE username = ? AND password = ?\\", [user, pass]);"}]}',
  "",
  "Rules:",
  "- severity must be HIGH, MEDIUM, or LOW",
  "- line must be the actual line number",
  "- description under 80 chars",
  "- fix under 80 chars",
  "- fixedCode = corrected version of that line only",
  "- Return ALL vulnerabilities",
  "- Respond with ONLY JSON, no markdown fences",
].join("\n");

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({
        vulnerabilities: [{ type: "Config Error", severity: "LOW", line: 1, description: "Add OPENAI_API_KEY to .env.local", fix: "Set the env variable", fixedCode: "" }],
      });
    }

    const text = await callAI(scanPrompt + "\n\nCode to scan:\n" + code);

    try {
      const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      const vulnerabilities = (parsed.vulnerabilities || []).map((v: Record<string, unknown>) => ({
        type: String(v.type || "Unknown"),
        severity: ["HIGH", "MEDIUM", "LOW"].includes(String(v.severity)) ? String(v.severity) : "MEDIUM",
        line: typeof v.line === "number" ? v.line : 1,
        description: String(v.description || "Security issue detected"),
        fix: String(v.fix || "Review this code"),
        fixedCode: String(v.fixedCode || ""),
      }));
      return NextResponse.json({ vulnerabilities });
    } catch {
      return NextResponse.json({
        vulnerabilities: [{ type: "Parse Error", severity: "LOW", line: 1, description: text.substring(0, 80), fix: "Try scanning again", fixedCode: "" }],
      });
    }
  } catch (error) {
    console.error("Scan Error:", error);
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }
}
