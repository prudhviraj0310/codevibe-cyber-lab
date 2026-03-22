"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Editor, { Vulnerability } from "@/components/Editor";
import AIPanel from "@/components/AIPanel";
import ExploitPanel from "@/components/ExploitPanel";
import ScanResults from "@/components/ScanResults";
import TerminalPanel from "@/components/TerminalPanel";
import { fileContents } from "@/utils/constants";

export default function Home() {
  const [activeFile, setActiveFile] = useState("login.js");
  const [liveCode, setLiveCode] = useState(fileContents["login.js"] || "");
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  const handleFileSelect = (fileName: string) => {
    setActiveFile(fileName);
    setLiveCode(fileContents[fileName] || "");
    setVulnerabilities([]);
  };

  const handleScan = useCallback(async () => {
    if (isScanning || !liveCode.trim()) return;
    setIsScanning(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: liveCode }),
      });
      if (!response.ok) throw new Error("Scan failed");
      const data = await response.json();
      setVulnerabilities(data.vulnerabilities || []);
    } catch (error) {
      console.error("Scan error:", error);
      setVulnerabilities([]);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, liveCode]);

  const handleFix = useCallback((vuln: Vulnerability) => {
    if (!vuln.fixedCode) return;
    const replaceFn = (window as unknown as Record<string, (line: number, text: string) => void>).__editorReplaceLine;
    if (replaceFn) {
      replaceFn(vuln.line, vuln.fixedCode);
      setVulnerabilities((prev) => prev.filter((v) => v.line !== vuln.line));
    }
  }, []);

  const handleJumpToLine = useCallback((line: number) => {
    const jumpFn = (window as unknown as Record<string, (line: number) => void>).__editorJumpToLine;
    if (jumpFn) jumpFn(line);
  }, []);

  // Handle "Apply to Editor" from AI chat
  const handleInsertCode = useCallback((code: string) => {
    const replaceAllFn = (window as unknown as Record<string, (code: string) => void>).__editorReplaceAll;
    if (replaceAllFn) {
      replaceAllFn(code);
    }
  }, []);

  // Handle "Run Code" - sends code to terminal as a Node.js command
  const handleRunCode = useCallback(() => {
    // Write code to temp file and execute in terminal
    const sendToTerminal = (command: string) => {
      const ws = (document.querySelector("[data-terminal-ws]") as HTMLElement)?.dataset?.ws;
      if (!ws) {
        // Fallback: find the WebSocket through the terminal reference
        // The terminal should already be connected, we send via the exposed function
        const termWs = (window as unknown as Record<string, WebSocket>).__terminalWs;
        if (termWs && termWs.readyState === WebSocket.OPEN) {
          termWs.send(command + "\n");
        }
      }
    };
    sendToTerminal(`node -e '${liveCode.replace(/'/g, "'\\''")}'`);
  }, [liveCode]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal with Ctrl+`
      if (e.key === "`" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Title Bar */}
      <header className="h-10 min-h-[40px] bg-panel border-b border-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <h1 className="text-[13px] font-semibold text-foreground tracking-tight">
              CodeVibe Cyber Lab
            </h1>
          </div>
          <div className="w-px h-4 bg-border" />
          <nav className="flex items-center gap-1">
            {["File", "Edit", "View", "Terminal", "Help"].map((item) => (
              <button
                key={item}
                className="text-[12px] text-text-muted hover:text-foreground hover:bg-hover px-2 py-1 rounded transition-colors"
                onClick={item === "Terminal" ? () => setShowTerminal((p) => !p) : undefined}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Run Code button */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-semibold transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Run Code
          </button>
          <span className="text-[11px] text-text-muted flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Sandbox Mode
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeFile={activeFile} onFileSelect={handleFileSelect} />

        {/* Center: Editor + ScanResults + ExploitPanel + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Editor
            activeFile={activeFile}
            onCodeChange={setLiveCode}
            vulnerabilities={vulnerabilities}
            onScan={handleScan}
            isScanning={isScanning}
          />
          <ScanResults
            vulnerabilities={vulnerabilities}
            isScanning={isScanning}
            onFix={handleFix}
            onJumpToLine={handleJumpToLine}
          />
          <ExploitPanel code={liveCode} />
          <TerminalPanel isVisible={showTerminal} />
        </div>

        <AIPanel code={liveCode} onInsertCode={handleInsertCode} />
      </div>

      {/* Status Bar */}
      <footer className="h-6 min-h-[24px] bg-accent/10 border-t border-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-accent font-medium flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286z" />
            </svg>
            CodeVibe Cyber Lab
          </span>
          <span className="text-[11px] text-text-muted">Educational Environment</span>
        </div>
        <div className="flex items-center gap-4">
          {vulnerabilities.length > 0 && (
            <span className="text-[11px] text-red-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {vulnerabilities.length} issue{vulnerabilities.length === 1 ? "" : "s"}
            </span>
          )}
          <button
            onClick={() => setShowTerminal((p) => !p)}
            className={`text-[11px] flex items-center gap-1 transition-colors ${showTerminal ? "text-accent" : "text-text-muted hover:text-foreground"}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3" />
            </svg>
            Terminal
          </button>
          <span className="text-[11px] text-text-muted">JavaScript</span>
          <span className="text-[11px] text-text-muted">UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
