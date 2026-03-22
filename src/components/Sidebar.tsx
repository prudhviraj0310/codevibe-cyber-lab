"use client";

import { useState } from "react";

interface SidebarFile {
  name: string;
  icon: string;
  language: string;
}

const files: SidebarFile[] = [
  { name: "login.js", icon: "JS", language: "javascript" },
  { name: "server.js", icon: "JS", language: "javascript" },
];

interface SidebarProps {
  activeFile: string;
  onFileSelect: (fileName: string) => void;
}

export default function Sidebar({ activeFile, onFileSelect }: SidebarProps) {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  return (
    <aside className="w-[220px] min-w-[220px] bg-panel border-r border-border flex flex-col h-full select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-text-muted">
          Explorer
        </span>
        <button
          onClick={() => setIsExplorerOpen(!isExplorerOpen)}
          className="text-text-muted hover:text-foreground transition-colors text-sm"
          aria-label="Toggle explorer"
        >
          {isExplorerOpen ? "−" : "+"}
        </button>
      </div>

      {/* File Tree */}
      {isExplorerOpen && (
        <div className="flex-1 overflow-y-auto py-1">
          {/* Project folder */}
          <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            <svg
              className="w-3.5 h-3.5 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span>cyber-lab</span>
          </div>

          {/* File List */}
          <div className="mt-1">
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => onFileSelect(file.name)}
                className={`w-full text-left px-4 py-1.5 flex items-center gap-2.5 text-[13px] transition-all duration-150 group
                  ${
                    activeFile === file.name
                      ? "bg-accent/10 text-accent border-l-2 border-accent"
                      : "text-text-muted hover:bg-hover hover:text-foreground border-l-2 border-transparent"
                  }`}
              >
                {/* File icon */}
                <span
                  className={`text-[10px] font-bold px-1 py-0.5 rounded font-mono
                  ${
                    activeFile === file.name
                      ? "bg-accent/20 text-accent"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {file.icon}
                </span>
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-[11px] text-text-muted">Sandbox Ready</span>
        </div>
      </div>
    </aside>
  );
}
