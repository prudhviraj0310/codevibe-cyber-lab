"use client";

import { Vulnerability } from "./Editor";

interface ScanResultsProps {
  vulnerabilities: Vulnerability[];
  isScanning: boolean;
  onFix: (vuln: Vulnerability) => void;
  onJumpToLine: (line: number) => void;
}

const sevColors = {
  HIGH: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20",
    dot: "bg-red-400",
  },
  MEDIUM: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/20",
    dot: "bg-amber-400",
  },
  LOW: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/20",
    dot: "bg-blue-400",
  },
};

export default function ScanResults({
  vulnerabilities,
  isScanning,
  onFix,
  onJumpToLine,
}: ScanResultsProps) {
  if (isScanning) {
    return (
      <div className="bg-panel border-t border-border px-4 py-3 flex items-center gap-2.5">
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-[12px] text-text-muted">Scanning for vulnerabilities...</span>
      </div>
    );
  }

  if (vulnerabilities.length === 0) return null;

  return (
    <div className="bg-panel border-t border-border max-h-[200px] overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between sticky top-0 bg-panel z-10">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
            Problems
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
            {vulnerabilities.length}
          </span>
        </div>
      </div>

      {/* Vulnerability List */}
      <div className="divide-y divide-border/50">
        {vulnerabilities.map((vuln, i) => {
          const sev = sevColors[vuln.severity as keyof typeof sevColors] || sevColors.MEDIUM;
          return (
            <div
              key={i}
              className="px-4 py-2.5 hover:bg-hover/50 transition-colors cursor-pointer group"
              onClick={() => onJumpToLine(vuln.line)}
            >
              <div className="flex items-start gap-2">
                {/* Severity dot */}
                <div className={`w-2 h-2 rounded-full ${sev.dot} mt-1.5 shrink-0`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[12px] font-semibold ${sev.text}`}>{vuln.type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sev.badge} ${sev.text}`}>
                      {vuln.severity}
                    </span>
                    <span className="text-[10px] text-text-muted/50 font-mono">Ln {vuln.line}</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{vuln.description}</p>
                  <p className="text-[10px] text-accent/70 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    {vuln.fix}
                  </p>
                </div>

                {/* Fix button */}
                {vuln.fixedCode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFix(vuln);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[10px] font-semibold whitespace-nowrap flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.07A.5.5 0 006 12.572V17a2 2 0 002 2h8a2 2 0 002-2v-4.428a.5.5 0 00-.036-.472l-5.384 3.07a1 1 0 01-.99 0z" />
                    </svg>
                    Fix with AI
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
