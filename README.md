## ⚡ ChatSpeed — Eliminate ChatGPT Lag Instantly

Surgical Network Graft for Real-Time Chat Performance

ChatSpeed is a high-performance Chrome extension that eliminates ChatGPT lag in long conversations.

It works by intercepting and optimizing ChatGPT’s internal JSON data stream in real time. It prunes unnecessary conversation nodes before they ever reach the React renderer.

The result is instant typing, smooth scrolling, and zero slowdown no matter how long your chat gets.

No refresh. No hacks. No UI tricks. Just real performance.

Designed for developers, power users, and anyone tired of ChatGPT slowing down.

---

## 🚀 The Problem The "Long Chat" Bottleneck

After around 30 to 50 messages, ChatGPT starts to slow down.  
After 200 or more, it becomes noticeably laggy.

This happens because the browser accumulates a massive hidden conversation graph, leading to:

- **Input Latency:** Stuttering while typing  
- **Memory Pressure:** Tabs consuming hundreds of MBs  
- **Render Lag:** Delays during message generation  

## 🛠️ The Solution: Surgical Network Grafting

Unlike simple UI cleaners, ChatSpeed operates at the network layer.

It intercepts ChatGPT’s conversation response and trims the conversation graph down to only the most recent context required, before it ever reaches the UI.

This ensures optimization happens before DOM inflation, not after.

Most tools clean the UI after it slows down.  
ChatSpeed prevents the slowdown before it even happens.

## ⚡ Key Features

- ⚡ **Instant Typing Response** — no input lag, even in massive chats  
- 🧠 **Smart Context Pruning** — keeps only what the model actually needs  
- 📉 **Memory Relief** — reduces hidden data load dramatically  
- 📊 **Live Telemetry Dashboard** — monitor nodes pruned and RAM saved in real-time  
- 🔒 **Privacy-First** — zero data collection, everything runs locally  


## 📊 Performance Metrics

| Metric | Without ChatSpeed | With ChatSpeed | Improvement |
|--------|------------------|----------------|-------------|
| DOM Nodes | 5,000+ | ~10–20 | 99%+ Reduction |
| Render Load | Heavy (Laggy) | Minimal (Instant) | Smooth UX |
| Memory Relieved | 0 MB | ~3–10 MB (Estimated) | Significant Relief |


## 🖥️ Demo

Watch ChatSpeed in action: [Demo Video Link](https://www.youtube.com/watch?v=acHwPFDIUSo)


## 🖥️ Dashboard Interface

The ChatSpeed HUD provides a systems-level view of optimization in real time.

- **Active:** Live stream interception is running  
- **Standby:** System is ready to intercept  
- **Unsupported:** Not on a compatible target  

Designed to feel like internal performance tooling used by engineers.

---

## 🔧 Installation & Usage

1. **Clone the repo**
```bash
git clone https://github.com/danishirfan21/Chat-Speed.git
cd chatspeed
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
npm run build
```

4. **Load in Chrome**
  - Go to `chrome://extensions`
  - Enable Developer Mode
  - Click Load unpacked
  - Select the dist folder


### Core Mechanism

- Intercepts `window.fetch` in the main world  
- Targets `/backend-api/conversation` responses  
- Reconstructs the conversation graph to retain only the last N nodes  
- Returns a modified JSON payload before React renders it

This ensures performance optimization happens before rendering, not after.

For deeper details, see ARCHITECTURE.md

## ⚠️ Quick Note for Power Users

ChatSpeed only optimizes the active conversation you are currently viewing.  
It does not intentionally modify the sidebar or your chat history list.

If ChatGPT’s sidebar ever fails to load, it is usually related to a temporary session or Cloudflare verification hiccup.

Quick reset:
- Toggle ChatSpeed off/on
- Refresh ChatGPT

If the issue persists:
- Log out and back into ChatGPT
- Refresh the page again

ChatSpeed is open source and still evolving.  
If you find a reproducible bug, please open a GitHub Issue with console logs and reproduction steps 🛠️

## 🛡️ Privacy & Security

ChatSpeed is open-source because trust is the primary metric.

- No external API calls
- No tracking or analytics
- All processing happens locally in your browser

## ⚖️ License

Distributed under the GPL-3.0 License.

This ensures the core "Surgical Graft" logic remains open and free for the community while protecting against closed-source commercial forks.

## 🏆 Developer’s Note

> Most tools try to clean the UI.  
> ChatSpeed fixes the problem before the UI even sees it.
