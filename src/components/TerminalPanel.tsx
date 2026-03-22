"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TerminalPanelProps {
  isVisible: boolean;
  onRunCode?: (code: string) => void;
}

export default function TerminalPanel({ isVisible }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<unknown>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const connectTerminal = useCallback(async () => {
    if (!terminalRef.current || xtermRef.current) return;

    setIsLoading(true);

    try {
      // Dynamically import xterm modules (client-side only)
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Import xterm CSS
      await import("@xterm/xterm/css/xterm.css");

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        fontSize: 13,
        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
        lineHeight: 1.4,
        theme: {
          background: "#020617",
          foreground: "#e2e8f0",
          cursor: "#38bdf8",
          cursorAccent: "#020617",
          selectionBackground: "rgba(56, 189, 248, 0.3)",
          black: "#1e293b",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          magenta: "#a855f7",
          cyan: "#38bdf8",
          white: "#f1f5f9",
          brightBlack: "#475569",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#facc15",
          brightBlue: "#60a5fa",
          brightMagenta: "#c084fc",
          brightCyan: "#67e8f9",
          brightWhite: "#f8fafc",
        },
        allowProposedApi: true,
        scrollback: 5000,
      });

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      if (terminalRef.current) {
        terminal.open(terminalRef.current);
        fitAddon.fit();
      }

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Connect WebSocket to terminal server
      const ws = new WebSocket("ws://localhost:3001");
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);

        // Send initial size
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          ws.send(`\x01RESIZE:${dims.cols},${dims.rows}`);
        }

        // Expose send function globally for AI agent to use
        (window as unknown as Record<string, unknown>).__terminalSend = (command: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(command + "\n");
          }
        };
        (window as unknown as Record<string, unknown>).__terminalWs = ws;
      };

      ws.onmessage = (event) => {
        terminal.write(event.data);
      };

      ws.onclose = () => {
        setIsConnected(false);
        terminal.write("\r\n\x1b[31m⚡ Disconnected from terminal server\x1b[0m\r\n");
        terminal.write("\x1b[90mRun: node terminal-server.js\x1b[0m\r\n");
      };

      ws.onerror = () => {
        setIsLoading(false);
        setIsConnected(false);
        terminal.write("\x1b[33m⚠ Terminal server not running\x1b[0m\r\n");
        terminal.write("\x1b[90mStart it with: node terminal-server.js\x1b[0m\r\n\r\n");
      };

      // Send keystrokes to server
      terminal.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims && ws.readyState === WebSocket.OPEN) {
            ws.send(`\x01RESIZE:${dims.cols},${dims.rows}`);
          }
        } catch {
          // ignore
        }
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    } catch (err) {
      console.error("Terminal init error:", err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible && !xtermRef.current) {
      // Small delay to ensure the container is rendered
      const timer = setTimeout(connectTerminal, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, connectTerminal]);

  // Re-fit when visibility changes
  useEffect(() => {
    if (isVisible && fitAddonRef.current) {
      setTimeout(() => {
        try {
          (fitAddonRef.current as { fit: () => void }).fit();
        } catch {
          // ignore
        }
      }, 50);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col bg-[#020617] border-t border-border" style={{ height: "250px" }}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-panel border-b border-border select-none shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-[12px] font-semibold text-foreground">Terminal</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
            isConnected
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted/50">
            {isConnected ? "zsh • Ready for Kali" : "Start: node terminal-server.js"}
          </span>
        </div>
      </div>

      {/* Terminal Canvas */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#020617]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-[12px] text-text-muted">Connecting to terminal...</span>
            </div>
          </div>
        )}
        <div
          ref={terminalRef}
          className="w-full h-full px-2 py-1"
          style={{ backgroundColor: "#020617" }}
        />
      </div>
    </div>
  );
}
