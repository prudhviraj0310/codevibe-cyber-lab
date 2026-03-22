"use client";

import { useState, useRef, useEffect } from "react";

interface InlinePromptProps {
  onGenerate: (instruction: string) => Promise<string>;
  onClose: () => void;
}

export default function InlinePrompt({ onGenerate, onClose }: InlinePromptProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const code = await onGenerate(input);
      setResult(code);
    } catch {
      setResult("// Error generating code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      // Insert code into editor
      const insertFn = (window as unknown as Record<string, (code: string) => void>).__editorInsertAtCursor;
      if (insertFn) insertFn(result);
      onClose();
    }
  };

  return (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 w-[500px]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Prompt Box */}
      <div className="relative bg-panel border border-accent/30 rounded-lg shadow-2xl shadow-accent/10 overflow-hidden">
        {/* Input Row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            disabled={isGenerating}
            placeholder="Generate code... (e.g., secure login with bcrypt)"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-text-muted/40 focus:outline-none disabled:opacity-50"
          />
          {isGenerating && (
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          )}
        </div>

        {/* Preview */}
        {result && (
          <div className="max-h-[300px] overflow-y-auto">
            <pre className="p-4 text-[12px] font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {result}
            </pre>
            {/* Accept / Reject */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-background/50">
              <button
                onClick={handleAccept}
                className="px-4 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded text-[12px] font-semibold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Accept
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-background hover:bg-hover text-text-muted border border-border rounded text-[12px] transition-all"
              >
                Reject
              </button>
              <span className="text-[10px] text-text-muted/40 ml-auto">
                <kbd className="px-1 py-0.5 bg-panel border border-border rounded text-[9px]">Esc</kbd> to close
              </span>
            </div>
          </div>
        )}

        {/* Hint when no result yet */}
        {!result && !isGenerating && (
          <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-text-muted/50">
            <span><kbd className="px-1 py-0.5 bg-background border border-border rounded">Enter</kbd> to generate</span>
            <span><kbd className="px-1 py-0.5 bg-background border border-border rounded">Esc</kbd> to close</span>
          </div>
        )}
      </div>
    </div>
  );
}
