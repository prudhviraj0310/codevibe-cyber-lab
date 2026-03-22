"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AIPanelProps {
  code: string;
  onInsertCode?: (code: string) => void;
}

interface Message {
  role: "user" | "ai" | "agent";
  content: string;
  command?: string;
  status?: "thinking" | "executing" | "done" | "error";
}

interface SecurityAnalysis {
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  description: string;
  fix: string;
}

// Intent keywords
const EXEC_KEYWORDS = ["scan", "run", "execute", "ping", "nmap", "curl", "test connection", "check port", "whois", "dig", "trace", "netcat", "nc ", "gobuster", "nikto", "hydra", "sqlmap", "brute", "enumerate"];
const WRITE_KEYWORDS = ["write", "generate", "create", "build", "implement", "make a"];
const FIX_KEYWORDS = ["fix all", "fix vulnerabilit", "secure this", "make secure", "patch"];

function detectIntent(text: string): "execute" | "write" | "fix" | "chat" {
  const lower = text.toLowerCase();
  if (EXEC_KEYWORDS.some((k) => lower.includes(k))) return "execute";
  if (FIX_KEYWORDS.some((k) => lower.includes(k))) return "fix";
  if (WRITE_KEYWORDS.some((k) => lower.includes(k))) return "write";
  return "chat";
}

function parseAnalysis(raw: string): SecurityAnalysis {
  const typeLower = raw.toLowerCase();
  let type = "Unknown";
  if (typeLower.includes("sql injection")) type = "SQL Injection";
  else if (typeLower.includes("xss")) type = "Cross-Site Scripting (XSS)";
  else if (typeLower.includes("no vulnerabilit") || typeLower.includes("secure")) type = "No Issues Found";
  else if (typeLower.includes("cors")) type = "CORS Misconfiguration";

  let severity: SecurityAnalysis["severity"] = "MEDIUM";
  if (typeLower.includes("high") || typeLower.includes("critical")) severity = "HIGH";
  else if (typeLower.includes("low")) severity = "LOW";
  else if (type === "No Issues Found") severity = "NONE";
  else if (type === "SQL Injection") severity = "HIGH";

  const sentences = raw.split(/[.!]\s/).filter((s) => s.trim().length > 15);
  const description = sentences.length > 0 ? sentences[0].replace(/\*\*/g, "").trim() + "." : "Potential security issue detected.";
  const fix = typeLower.includes("parameterized") ? "Use parameterized queries." : "Review and apply secure coding practices.";

  return { type, severity, description, fix };
}

const sevConfig = {
  HIGH: { label: "HIGH", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500/20" },
  MEDIUM: { label: "MEDIUM", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20" },
  LOW: { label: "LOW", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20" },
  NONE: { label: "NONE", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20" },
};

export default function AIPanel({ code, onInsertCode }: AIPanelProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "👋 Welcome to **CodeVibe Cyber Lab**!\n\nI'm your AI security agent. I can:\n• **Execute** — \"scan localhost for open ports\"\n• **Write code** — \"write a secure login function\"\n• **Fix code** — \"fix all vulnerabilities\"\n• **Explain** — \"what is SQL injection?\"\n\nI'll automatically detect your intent and act.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debounced auto-analysis
  const runAnalysis = useCallback(async (codeToAnalyze: string) => {
    if (analysisAbortRef.current) analysisAbortRef.current.abort();
    if (!codeToAnalyze.trim()) { setAnalysis(null); return; }
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToAnalyze, question: "Identify the main vulnerability type and severity. Be concise." }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("fail");
      const data = await response.json();
      setAnalysis(parseAnalysis(data.reply || ""));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runAnalysis(code), 2000);
    return () => clearTimeout(timer);
  }, [code, runAnalysis]);

  // Send command to terminal
  const sendToTerminal = useCallback((command: string) => {
    const sendFn = (window as unknown as Record<string, (cmd: string) => void>).__terminalSend;
    if (sendFn) {
      sendFn(command);
      return true;
    }
    return false;
  }, []);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const intent = detectIntent(text);
    setQuery("");
    setIsLoading(true);

    if (intent === "execute") {
      // AGENTIC FLOW: Generate command → show it → execute in terminal
      const agentMsg: Message = { role: "agent", content: `🤖 **Agent:** Processing "${text}"...`, status: "thinking" };
      setMessages((prev) => [...prev, { role: "user", content: text }, agentMsg]);

      try {
        // Step 1: Generate the command
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, instruction: text, mode: "command" }),
        });
        if (!response.ok) throw new Error("Failed to generate command");
        const data = await response.json();
        const command = data.command || "echo 'No command generated'";
        const explanation = data.explanation || "";

        // Step 2: Show the command
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "agent",
            content: `🤖 **Agent:** ${explanation}\n\n\`\`\`bash\n${command}\n\`\`\`\n\n⚡ Executing in terminal...`,
            command,
            status: "executing",
          };
          return updated;
        });

        // Step 3: Execute in terminal
        const sent = sendToTerminal(command);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "agent",
            content: `🤖 **Agent:** ${explanation}\n\n\`\`\`bash\n${command}\n\`\`\`\n\n${sent ? "✅ **Executed in terminal.** Check the output below." : "⚠️ Terminal not connected. Copy the command and run manually."}`,
            command,
            status: sent ? "done" : "error",
          };
          return updated;
        });
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "agent",
            content: "⚠️ **Agent Error:** Failed to generate command. Try again.",
            status: "error",
          };
          return updated;
        });
      }
    } else if (intent === "fix") {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, instruction: text, mode: "fix-all" }),
        });
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        setMessages((prev) => [...prev, {
          role: "agent",
          content: `🔧 **Agent:** Fixed all vulnerabilities:\n\n\`\`\`\n${data.generatedCode}\n\`\`\`\n\nClick **Apply to Editor** to replace your code.`,
          status: "done",
        }]);
      } catch {
        setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Fix generation failed." }]);
      }
    } else if (intent === "write") {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, instruction: text, mode: "generate" }),
        });
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        setMessages((prev) => [...prev, {
          role: "agent",
          content: `✨ **Agent:** Generated code:\n\n\`\`\`\n${data.generatedCode}\n\`\`\`\n\nClick **Apply to Editor** to insert.`,
          status: "done",
        }]);
      } catch {
        setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Code generation failed." }]);
      }
    } else {
      // Regular chat
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, question: text }),
        });
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "ai", content: data.reply || "No response." }]);
      } catch {
        setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Something went wrong." }]);
      }
    }
    setIsLoading(false);
  };

  const extractCodeBlocks = (content: string): string[] => {
    const blocks: string[] = [];
    const parts = content.split("```");
    for (let i = 1; i < parts.length; i += 2) {
      const block = parts[i].replace(/^\w*\n/, "").trim();
      if (block) blocks.push(block);
    }
    return blocks;
  };

  const sev = analysis ? sevConfig[analysis.severity] : null;

  return (
    <aside className="w-[340px] min-w-[340px] bg-panel border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Agent</h2>
            <p className="text-[10px] text-text-muted">Execute · Write · Fix · Explain</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          Active
        </span>
      </div>

      {/* Security Analysis Card */}
      <div className="px-3 pt-3 pb-1">
        {isAnalyzing ? (
          <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
            <span className="text-[11px] text-text-muted">Analyzing code...</span>
          </div>
        ) : analysis && sev ? (
          <div className={`rounded-lg border ${sev.border} ${sev.bg} p-3`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Security Analysis</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sev.badge} ${sev.text}`}>{sev.label}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <svg className={`w-3.5 h-3.5 ${sev.text} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={analysis.severity !== "NONE" ? "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" : "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
              <span className={`text-[13px] font-semibold ${sev.text}`}>{analysis.type}</span>
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed">{analysis.description}</p>
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[13px] scroll-smooth">
        {messages.map((msg, index) => {
          const codeBlocks = (msg.role === "ai" || msg.role === "agent") ? extractCodeBlocks(msg.content) : [];
          const isAgent = msg.role === "agent";

          return (
            <div key={index} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-3 py-2 rounded-lg max-w-[95%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent/20 text-foreground border border-accent/20 rounded-tr-none"
                  : isAgent
                  ? "bg-purple-500/10 border border-purple-500/20 text-foreground/90 rounded-tl-none whitespace-pre-wrap"
                  : "bg-background border border-border text-foreground/90 rounded-tl-none whitespace-pre-wrap"
              }`}>
                {/* Status indicator for agent messages */}
                {isAgent && msg.status === "thinking" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    <span className="text-[10px] text-purple-400 font-medium">Thinking...</span>
                  </div>
                )}
                {isAgent && msg.status === "executing" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-[10px] text-amber-400 font-medium">Executing...</span>
                  </div>
                )}

                {msg.content.split("```").map((block, i) => {
                  if (i % 2 !== 0) {
                    const codeContent = block.replace(/^\w*\n/, "").trim();
                    return (
                      <pre key={i} className="bg-panel p-2 rounded text-[11px] font-mono text-accent my-2 overflow-x-auto border border-border">
                        <code>{codeContent}</code>
                      </pre>
                    );
                  }
                  return (
                    <span key={i} dangerouslySetInnerHTML={{
                      __html: block
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>"),
                    }} />
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 ml-1 mt-0.5">
                {/* Re-run command button for agent messages */}
                {isAgent && msg.command && (
                  <button
                    onClick={() => sendToTerminal(msg.command!)}
                    className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/20 rounded text-[10px] font-semibold transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Re-run
                  </button>
                )}

                {/* Apply to Editor button for code blocks */}
                {(msg.role === "ai" || msg.role === "agent") && codeBlocks.length > 0 && !msg.command && onInsertCode && (
                  <button
                    onClick={() => onInsertCode(codeBlocks[0])}
                    className="px-2.5 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[10px] font-semibold transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                    Apply to Editor
                  </button>
                )}

                {/* Label */}
                {msg.role === "agent" && index > 0 && (
                  <span className="text-[10px] text-purple-400/60">Agent</span>
                )}
                {msg.role === "ai" && index > 0 && (
                  <span className="text-[10px] text-text-muted/60">AI Mentor</span>
                )}
                {msg.role === "user" && (
                  <span className="text-[10px] text-text-muted/60 mr-1">You</span>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col gap-1 items-start">
            <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-lg rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-purple-300 italic ml-1">Agent working...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-text-muted font-medium mb-2 block uppercase tracking-wider">Try These</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Scan localhost for open ports",
              "Write a secure login",
              "Fix all vulnerabilities",
              "What is SQL injection?",
            ].map((s) => (
              <button key={s} onClick={() => handleSubmit(s)}
                className="text-[11px] px-2.5 py-1.5 rounded-md bg-background border border-border text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all text-left"
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-panel">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(query); }}
            disabled={isLoading}
            placeholder={isLoading ? "Agent working..." : "scan localhost • write code • fix bugs..."}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit(query)}
            disabled={isLoading || !query.trim()}
            className="absolute right-1 top-1 bottom-1 px-3 bg-accent hover:bg-accent-dim text-panel rounded-md transition-all flex items-center justify-center disabled:opacity-50 disabled:bg-panel disabled:text-text-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-text-muted/40 mt-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
          Auto-detects intent: execute • write • fix • explain
        </p>
      </div>
    </aside>
  );
}
