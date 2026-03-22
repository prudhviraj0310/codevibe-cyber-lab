"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect, useCallback } from "react";
import { fileContents } from "@/utils/constants";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-panel">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-text-muted text-sm">Loading Editor...</span>
      </div>
    </div>
  ),
});

export interface Vulnerability {
  type: string;
  severity: string;
  line: number;
  description: string;
  fix: string;
  fixedCode: string;
}

interface EditorProps {
  activeFile: string;
  onCodeChange?: (code: string) => void;
  vulnerabilities?: Vulnerability[];
  onScan?: () => void;
  isScanning?: boolean;
}

export default function Editor({
  activeFile,
  onCodeChange,
  vulnerabilities = [],
  onScan,
  isScanning = false,
}: EditorProps) {
  const code = fileContents[activeFile] || "// Select a file to start editing";
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  // Apply vulnerability decorations when they change
  const applyDecorations = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;

    const newDecorations = vulnerabilities.map((vuln) => {
      let className = "vuln-line-medium";
      let glyphClass = "vuln-glyph-medium";
      if (vuln.severity === "HIGH") {
        className = "vuln-line-high";
        glyphClass = "vuln-glyph-high";
      } else if (vuln.severity === "LOW") {
        className = "vuln-line-low";
        glyphClass = "vuln-glyph-low";
      }

      return {
        range: {
          startLineNumber: vuln.line,
          startColumn: 1,
          endLineNumber: vuln.line,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: className,
          glyphMarginClassName: glyphClass,
          glyphMarginHoverMessage: { value: `**${vuln.type}** (${vuln.severity})\n\n${vuln.description}\n\n💡 ${vuln.fix}` },
          hoverMessage: { value: `⚠️ **${vuln.type}** — ${vuln.description}\n\n💡 *Fix:* ${vuln.fix}` },
        },
      };
    });

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = ed.createDecorationsCollection(newDecorations);
  }, [vulnerabilities]);

  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    // Apply any existing decorations
    applyDecorations();
  };

  // Expose a method to jump to a specific line
  const jumpToLine = useCallback((line: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.revealLineInCenter(line);
    ed.setPosition({ lineNumber: line, column: 1 });
    ed.focus();
  }, []);

  // Expose jumpToLine on the component via a ref trick (will be stored in page.tsx)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__editorJumpToLine = jumpToLine;
  }, [jumpToLine]);

  // Expose a method to replace a line
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__editorReplaceLine = (line: number, newText: string) => {
      const ed = editorRef.current;
      if (!ed) return;
      const model = ed.getModel();
      if (!model) return;
      const lineContent = model.getLineContent(line);
      const range = {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: lineContent.length + 1,
      };
      ed.executeEdits("fix-with-ai", [{ range, text: newText }]);
      // Trigger onCodeChange with updated value
      if (onCodeChange) {
        onCodeChange(model.getValue());
      }
    };
  }, [onCodeChange]);

  // Expose insertAtCursor for Cmd+K / inline prompt
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__editorInsertAtCursor = (text: string) => {
      const ed = editorRef.current;
      if (!ed) return;
      const position = ed.getPosition();
      if (!position) return;
      ed.executeEdits("ai-generate", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: text,
      }]);
      if (onCodeChange) {
        const model = ed.getModel();
        if (model) onCodeChange(model.getValue());
      }
    };
  }, [onCodeChange]);

  // Expose replaceAllCode for "Apply to Editor" / "Fix All"
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__editorReplaceAll = (newCode: string) => {
      const ed = editorRef.current;
      if (!ed) return;
      const model = ed.getModel();
      if (!model) return;
      const fullRange = model.getFullModelRange();
      ed.executeEdits("ai-replace-all", [{
        range: fullRange,
        text: newCode,
      }]);
      if (onCodeChange) {
        onCodeChange(newCode);
      }
    };
  }, [onCodeChange]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Editor Tab Bar */}
      <div className="bg-panel border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center gap-0">
            <div className="px-4 py-2 text-[13px] bg-background text-foreground border-r border-border flex items-center gap-2">
              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono">
                JS
              </span>
              <span>{activeFile}</span>
              <span className="w-2 h-2 rounded-full bg-accent/50 ml-1" />
            </div>
          </div>
          {/* Breadcrumb path */}
          <div className="ml-4 text-[12px] text-text-muted flex items-center gap-1">
            <span>cyber-lab</span>
            <span className="text-border">/</span>
            <span className="text-foreground/70">{activeFile}</span>
          </div>
        </div>

        {/* Scan Button */}
        <div className="pr-3 flex items-center gap-2">
          {vulnerabilities.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {vulnerabilities.length} issue{vulnerabilities.length > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="px-3 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Scan Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={(value) => {
            if (onCodeChange && value !== undefined) {
              onCodeChange(value);
            }
          }}
          options={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
            glyphMargin: true,
          }}
        />
      </div>
    </div>
  );
}
