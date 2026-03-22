// Terminal WebSocket Server
// Spawns a PTY (pseudo-terminal) and bridges it to browser via WebSocket
// Swap the shell command to connect to Docker/Kali when ready

const { WebSocketServer } = require("ws");
const pty = require("node-pty");
const os = require("os");

const PORT = 3001;

// Shell configuration — CHANGE THIS LINE to connect to Kali Linux via Docker:
// const shell = "docker";
// const shellArgs = ["exec", "-it", "kali-container", "/bin/bash"];
const shell = os.platform() === "win32" ? "powershell.exe" : "/bin/zsh";
const shellArgs = ["--login"];

const wss = new WebSocketServer({ port: PORT });

console.log(`\x1b[36m⚡ Terminal server running on ws://localhost:${PORT}\x1b[0m`);

wss.on("connection", (ws) => {
  console.log("\x1b[32m● Client connected\x1b[0m");

  const ptyProcess = pty.spawn(shell, shellArgs, {
    name: "xterm-256color",
    cols: 120,
    rows: 30,
    cwd: process.env.HOME || "/tmp",
    env: {
      ...process.env,
      TERM: "xterm-256color",
    },
  });

  // PTY → Browser
  ptyProcess.onData((data) => {
    try {
      ws.send(data);
    } catch (e) {
      // client disconnected
    }
  });

  // Browser → PTY
  ws.on("message", (msg) => {
    const message = msg.toString();

    // Handle resize messages
    if (message.startsWith("\x01RESIZE:")) {
      try {
        const parts = message.substring(8).split(",");
        const cols = parseInt(parts[0], 10);
        const rows = parseInt(parts[1], 10);
        if (cols > 0 && rows > 0) {
          ptyProcess.resize(cols, rows);
        }
      } catch (e) {
        // ignore bad resize
      }
      return;
    }

    ptyProcess.write(message);
  });

  ws.on("close", () => {
    console.log("\x1b[33m○ Client disconnected\x1b[0m");
    ptyProcess.kill();
  });

  ptyProcess.onExit(() => {
    try {
      ws.close();
    } catch (e) {
      // already closed
    }
  });
});

process.on("SIGINT", () => {
  console.log("\n\x1b[31m✕ Terminal server shutting down\x1b[0m");
  wss.close();
  process.exit(0);
});
