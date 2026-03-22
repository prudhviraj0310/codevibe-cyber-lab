import { NextResponse } from "next/server";
import { callAI, isConfigured } from "@/utils/ai";

export async function POST(req: Request) {
  try {
    const { code, instruction, mode } = await req.json();

    if (!instruction && mode !== "fix-all") {
      return NextResponse.json({ error: "Instruction is required." }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({ generatedCode: "// API key not configured. Add OPENAI_API_KEY to .env.local" });
    }

    let prompt = "";

    if (mode === "fix-all") {
      prompt = "You are a security code fixer. Rewrite the following code to fix ALL security vulnerabilities.\nKeep the same functionality but make it secure.\nReturn ONLY the fixed code, no explanations, no markdown fences.\n\nOriginal code:\n" + code;
    } else if (mode === "generate") {
      prompt = "You are a security-focused code generator.\nGenerate code based on the following instruction.\nReturn ONLY the code, no explanations, no markdown fences.\n\nInstruction: " + instruction + (code ? "\n\nContext:\n" + code : "");
    } else if (mode === "edit") {
      prompt = "You are a code editor. Edit the following code based on the instruction.\nReturn ONLY the modified code, no explanations, no markdown fences.\n\nInstruction: " + instruction + "\n\nCode:\n" + code;
    } else if (mode === "autopilot") {
      prompt = [
        "You are an elite, autonomous CTF and Pentesting Agent.",
        "The user has provided a target URL or IP.",
        "Your task is to write a highly effective, sequential bash script that executes a complete 4-phase penetration test.",
        "The script must follow this exact methodology:",
        "Phase 1: Setup & Reconnaissance - Run `nmap` to discover open ports and services.",
        "Phase 2: Web Fuzzing - If port 80/443 is open, run `ffuf` or `zaproxy` to find hidden endpoints/directories.",
        "Phase 3: Auth Cracking - If SSH, FTP, or a hidden login is found, run `hydra` to brute-force credentials using a standard wordlist.",
        "Phase 4: Database Infiltration - Run `sqlmap` against the URL to find SQL injections and dump the database.",
        "Output all findings neatly to the terminal with echo statements dividing the phases.",
        "Return ONLY the raw, executable bash script code. Do not include markdown formatting or explanations.",
        "",
        "Target/Instruction: " + instruction,
      ].join("\n");

      const text = await callAI(prompt);
      // Remove any markdown just in case the AI ignored instructions
      const cleanedScript = text.replace(/^```bash?\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/i, "").trim();
      
      return NextResponse.json({
        script: cleanedScript,
        explanation: "Auto-pilot script generated.",
      });
    } else if (mode === "command") {
      prompt = [
        "You are an ethical hacking terminal assistant. Convert the user's request into a terminal command.",
        'Return ONLY a JSON object: {"command":"<terminal command>","explanation":"<one line explanation>"}',
        "Rules: Use tools like nmap, nc, curl, ping, dig, whois. Keep safe. Return ONLY JSON.",
        "",
        "User request: " + instruction,
        code ? "\nCode context:\n" + code : "",
      ].join("\n");

      const text = await callAI(prompt);
      const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({
          command: parsed.command || "echo 'No command generated'",
          explanation: parsed.explanation || "AI generated command",
        });
      } catch {
        return NextResponse.json({ command: cleaned, explanation: "AI generated command" });
      }
    } else {
      prompt = "You are a cybersecurity coding assistant.\nGenerate code based on the instruction.\nReturn ONLY the code, no markdown fences.\n\nInstruction: " + instruction + (code ? "\n\nContext:\n" + code : "");
    }

    let text = await callAI(prompt);
    if (text.startsWith("```")) {
      text = text.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
    }
    return NextResponse.json({ generatedCode: text });
  } catch (error) {
    console.error("Generate Error:", error);
    return NextResponse.json({ error: "Code generation failed." }, { status: 500 });
  }
}
