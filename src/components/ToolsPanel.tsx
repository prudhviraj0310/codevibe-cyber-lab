"use client";

import { useState } from "react";

type ToolType = "nmap" | "sqlmap" | "hydra" | "ffuf" | "zap";

export default function ToolsPanel() {
  const [activeTab, setActiveTab] = useState<ToolType>("nmap");

  // Nmap state
  const [nmapTarget, setNmapTarget] = useState("");
  const [nmapType, setNmapType] = useState("-sV -sC");

  // sqlmap state
  const [sqlTarget, setSqlTarget] = useState("");
  const [sqlLevel, setSqlLevel] = useState("1");
  const [sqlDump, setSqlDump] = useState(false);

  // hydra state
  const [hydraTarget, setHydraTarget] = useState("");
  const [hydraService, setHydraService] = useState("ssh");
  const [hydraUser, setHydraUser] = useState("admin");
  const [hydraPassList, setHydraPassList] = useState("/usr/share/wordlists/rockyou.txt");

  // ffuf state
  const [ffufTarget, setFfufTarget] = useState("http://target.com/FUZZ");
  const [ffufWordlist, setFfufWordlist] = useState("/usr/share/wordlists/dirb/common.txt");

  // ZAP state
  const [zapTarget, setZapTarget] = useState("");

  const handleRun = (command: string) => {
    const sendFn = (window as unknown as Record<string, (cmd: string) => void>).__terminalSend;
    if (sendFn && command.trim()) {
      sendFn(command);
    } else {
      console.warn("Terminal not connected or empty command");
    }
  };

  const tabs: { id: ToolType; label: string; icon: string; name: string }[] = [
    { id: "zap", label: "Proxy/Scan", name: "OWASP ZAP", icon: "🕷️" },
    { id: "nmap", label: "Network", name: "Nmap", icon: "🌐" },
    { id: "sqlmap", label: "Injection", name: "sqlmap", icon: "💉" },
    { id: "hydra", label: "Auth", name: "Hydra", icon: "🔑" },
    { id: "ffuf", label: "Fuzzing", name: "ffuf", icon: "🚀" },
  ];

  return (
    <div className="flex flex-col bg-panel border-t border-border shrink-0 select-none">
      {/* Tabs Header */}
      <div className="flex bg-background border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold transition-colors border-r border-border whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-panel text-accent border-b-2 border-b-accent"
                : "bg-background text-text-muted hover:bg-hover hover:text-foreground border-b-2 border-b-transparent"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="opacity-60">{tab.label}:</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tool Content Area */}
      <div className="p-3 h-[120px] overflow-y-auto">
        {/* NMAP */}
        {activeTab === "nmap" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Target IP / Domain</label>
                <input
                  type="text"
                  value={nmapTarget}
                  onChange={(e) => setNmapTarget(e.target.value)}
                  placeholder="e.g., 192.168.1.100 or scanme.nmap.org"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Scan Type</label>
                <select
                  value={nmapType}
                  onChange={(e) => setNmapType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50 appearance-none cursor-pointer"
                >
                  <option value="-sV -sC">Version & Default Scripts (-sV -sC)</option>
                  <option value="-p- -T4">All Ports Fast (-p- -T4)</option>
                  <option value="-sS -O">Stealth & OS Detect (-sS -O)</option>
                  <option value="-A">Aggressive Scan (-A)</option>
                </select>
              </div>
              <button
                onClick={() => handleRun(`nmap ${nmapType} ${nmapTarget}`)}
                disabled={!nmapTarget}
                className="px-4 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[29px]"
              >
                Run Nmap
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Command preview:</span>
              <code className="text-[10px] text-emerald-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                nmap {nmapType} {nmapTarget || "<target>"}
              </code>
            </div>
          </div>
        )}

        {/* SQLMAP */}
        {activeTab === "sqlmap" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Target URL (with vulnerable parameter)</label>
                <input
                  type="text"
                  value={sqlTarget}
                  onChange={(e) => setSqlTarget(e.target.value)}
                  placeholder="http://example.com/page?id=1"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Risk/Level</label>
                <select
                  value={sqlLevel}
                  onChange={(e) => setSqlLevel(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50 appearance-none cursor-pointer"
                >
                  <option value="1">Level 1</option>
                  <option value="3">Level 3</option>
                  <option value="5">Level 5</option>
                </select>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer h-[29px] px-2 hover:text-foreground">
                <input type="checkbox" checked={sqlDump} onChange={(e) => setSqlDump(e.target.checked)} className="accent-accent" />
                --dump
              </label>
              <button
                onClick={() => handleRun(`sqlmap -u "${sqlTarget}" --batch --level=${sqlLevel} ${sqlDump ? "--dump" : "--dbs"}`)}
                disabled={!sqlTarget}
                className="px-4 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50 h-[29px]"
              >
                Run sqlmap
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Command preview:</span>
              <code className="text-[10px] text-emerald-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                sqlmap -u "{sqlTarget || "<target>"}" --batch --level={sqlLevel} {sqlDump ? "--dump" : "--dbs"}
              </code>
            </div>
          </div>
        )}

        {/* HYDRA */}
        {activeTab === "hydra" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              <div className="w-1/4">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Target IP</label>
                <input type="text" value={hydraTarget} onChange={(e) => setHydraTarget(e.target.value)} placeholder="10.0.0.1" className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50" />
              </div>
              <div className="w-20">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Service</label>
                <select value={hydraService} onChange={(e) => setHydraService(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50 appearance-none">
                  <option value="ssh">ssh</option>
                  <option value="ftp">ftp</option>
                  <option value="rdp">rdp</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">User (-l)</label>
                <input type="text" value={hydraUser} onChange={(e) => setHydraUser(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Passlist (-P)</label>
                <input type="text" value={hydraPassList} onChange={(e) => setHydraPassList(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50" />
              </div>
              <button
                onClick={() => handleRun(`hydra -l ${hydraUser} -P ${hydraPassList} ${hydraTarget} ${hydraService}`)}
                disabled={!hydraTarget}
                className="px-4 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all h-[29px] disabled:opacity-50"
              >
                Run Hydra
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Command preview:</span>
              <code className="text-[10px] text-emerald-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                hydra -l {hydraUser} -P {hydraPassList} {hydraTarget || "<target>"} {hydraService}
              </code>
            </div>
          </div>
        )}

        {/* FFUF */}
        {activeTab === "ffuf" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Target URL (must contain FUZZ keyword)</label>
                <input
                  type="text"
                  value={ffufTarget}
                  onChange={(e) => setFfufTarget(e.target.value)}
                  placeholder="http://example.com/FUZZ"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Wordlist path (-w)</label>
                <input
                  type="text"
                  value={ffufWordlist}
                  onChange={(e) => setFfufWordlist(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50"
                />
              </div>
              <button
                onClick={() => handleRun(`ffuf -w ${ffufWordlist} -u ${ffufTarget}`)}
                disabled={!ffufTarget.includes("FUZZ")}
                className="px-4 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all h-[29px] disabled:opacity-50"
              >
                Run ffuf
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Command preview:</span>
              <code className="text-[10px] text-emerald-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                ffuf -w {ffufWordlist} -u {ffufTarget || "<target>"}
              </code>
            </div>
          </div>
        )}

        {/* OWASP ZAP */}
        {activeTab === "zap" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1 font-medium">Target URL to Scan</label>
                <input
                  type="text"
                  value={zapTarget}
                  onChange={(e) => setZapTarget(e.target.value)}
                  placeholder="http://example.com"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-accent/50"
                />
              </div>
              <button
                onClick={() => handleRun(`zaproxy -cmd -quickurl ${zapTarget} -quickprogress`)}
                disabled={!zapTarget}
                className="px-4 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded text-[11px] font-semibold transition-all h-[29px] disabled:opacity-50"
              >
                Run ZAP CLI
              </button>
              <button
                onClick={() => handleRun(`docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py -t ${zapTarget} -g gen.conf -r report.html`)}
                disabled={!zapTarget}
                className="px-4 py-1.5 hover:bg-hover text-text-muted hover:text-foreground border border-border rounded text-[11px] font-semibold transition-all h-[29px] disabled:opacity-50"
              >
                Run via Docker
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-text-muted">Command preview:</span>
              <code className="text-[10px] text-emerald-400 font-mono bg-background px-1.5 py-0.5 rounded border border-border max-w-[80%] truncate">
                zaproxy -cmd -quickurl {zapTarget || "<target>"} -quickprogress
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
