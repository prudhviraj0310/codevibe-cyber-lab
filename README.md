# 🕶️ CodeVibe Cyber Lab

> **The "Cursor" for Ethical Hacking** — An AI-powered Security IDE purpose-built for pentesters, bug bounty hunters, and cybersecurity students.

![CodeVibe Cyber Lab](https://raw.githubusercontent.com/prudhviraj0310/codevibe-cyber-lab/main/public/demo.png) *(Add a screenshot here later)*

CodeVibe Cyber Lab is next-generation web-based IDE that brings agentic AI capabilities directly into a security environment. Instead of just writing software, this IDE helps you detect vulnerabilities, write secure exploits, and interact natively with a Kali Linux environment directly from the browser.

## ✨ Features

- **Agentic Security AI:** Auto-detects your intent. Ask it to "scan localhost for open ports" or "fix all vulnerabilities in this code" and watch it execute autonomously.
- **Real Kali Linux Terminal integration:** Built-in `xterm.js` terminal connected via WebSockets to a real `zsh` backend (ready for Dockerized Kali Linux).
- **Proactive Vulnerability Scanner:** Editor scans code on the fly and highlights vulnerable lines (like SQLi or XSS) with severity levels directly in Monaco Editor.
- **Exploit Simulator:** Test simulated payloads against your code to visually verify if an attack is successful.
- **"Apply to Editor" / Fix All:** Let the AI securely rewrite entire blocks of code and insert them directly into the editor with one click.
- **Security-focused UI/UX:** A beautiful, dark-themed, glassmorphic UI built to look and feel like an authentic hacker terminal.

## 🛠️ Architecture

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Terminal:** `xterm.js`, `node-pty`, WebSockets
- **AI Brain:** OpenAI (`gpt-4o-mini`) via shared abstraction (can easily swap back to Google Gemini)
- **Language:** TypeScript & Node.js

## 🚀 Getting Started

### 1. Requirements
- Node.js (v18+)
- Docker (Optional, but required if you want the terminal to run true Kali Linux instead of your local shell)
- An OpenAI API Key

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/prudhviraj0310/codevibe-cyber-lab.git
cd codevibe-cyber-lab
```

Install dependencies:
```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory and add your API keys:
```env
OPENAI_API_KEY=sk-proj-your-key-here
GEMINI_API_KEY=your-gemini-key-here # (Backup)
```

### 4. Running the IDE

You need to run **both** the Next.js frontend and the WebSocket terminal server.

**Terminal 1 (Next.js IDE):**
```bash
npm run dev
```

**Terminal 2 (WebSocket Terminal Server):**
```bash
node terminal-server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 Connecting to Kali Linux (Real Tools)

By default, the IDE terminal connects to your host machine's shell (`/bin/zsh`) for ease of development. 

To bridge the IDE terminal into a real **Kali Linux** Docker container that has `nmap`, `sqlmap`, `hydra`, `ffuf`, and `zaproxy` pre-installed:

1. Build and start the custom Kali container:
   ```bash
   npm run kali:up
   ```
2. Start the Terminal Server bridged into Kali:
   ```bash
   npm run terminal:kali
   ```
3. Refresh the IDE browser page. Your IDE terminal is now rooted inside the Kali container, and tools like `nmap` and `sqlmap` will work natively with the files in your project!

To stop the Kali container when you're done:
   ```bash
   npm run kali:down
   ```


## 📜 License

This project is created for **educational purposes only**. Always ensure you have explicit, written permission before testing or exploiting any systems or networks.

---

Built with ❤️ for the Cybersecurity community.
