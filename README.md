# 🚀 Antigravity Auto-Pilot

**Antigravity Auto-Pilot** is a powerful VS Code extension designed to streamline your multi-agent workflow by automatically managing agent prompts. No more manual clicking—let Auto-Pilot handle the routine while you stay in the flow.

## ✨ Key Features

-   **🤖 Intelligent Automation**: Automatically detects and clicks "Accept", "Apply", "Run", and "Confirm" buttons within Antigravity and specific web-based agent environments.
-   **🎯 Decision Priority**: Smart logic prioritizes "All" actions (e.g., *Accept All*, *Apply All Changes*) to maximize throughput.
-   **🛡️ Safety First**: Integrated command blocklist prevents execution of dangerous terminal commands (e.g., `rm -rf`, `mkfs`).
-   **💾 Persistence**: Remembers your ON/OFF preference across VS Code sessions.
-   **🔍 Context Awareness**: Intelligent filtering ensures it only interacts with relevant buttons, avoiding VS Code's core UI (Activity Bar, Status Bar, etc.) and Quokka/Wallaby files.
-   **⚡ High Performance**: Low-latency polling (300ms) ensures near-instant response to agent requests.

## 🛠️ How it Works

Auto-Pilot connects to the Antigravity frontend using the **Chrome DevTools Protocol (CDP)**. It scans active ports (9000, 9222-9236) and safely injects an automation script into authorized targets.

## 🚀 Getting Started

1.  **Toggle ON/OFF**: Click the status bar indicator (bottom-right) or use the command palette (`Auto-Pilot: Toggle ON/OFF`).
2.  **Monitor**: Once ON, Auto-Pilot will start scanning for prompts. You can view the activity in the `Auto-Pilot` Output channel.
3.  **Automatic Connection**: If Auto-Pilot cannot find a CDP target, it will prompt you with instructions.

---

*Streamline your agent orchestration with Antigravity Auto-Pilot.*
