# Antigravity Auto-Pilot

Antigravity Auto-Pilot is a VS Code extension that automatically accepts agent prompts (file edits, terminal commands, etc.) to streamline your multi-agent workflow.

## Quick Start

1.  **Install** the extension.
2.  **Enable Auto-Pilot**: Click on the "Auto-Pilot: OFF" status bar item in the bottom right corner of your IDE.
3.  **Automatic Connection**: The extension will automatically try to connect to Antigravity on port **9000** (default) or **9222**.

If the extension cannot connect automatically (it scans ports **9000** and **9222**), you may need to start Antigravity with the remote debugging flag manually.

1.  **Close** Antigravity.
2.  **Open** your terminal (PowerShell, CMD, or Bash).
3.  **Run** the following command:

    ```bash
    antigravity --remote-debugging-port=9222
    ```

4.  Once Antigravity opens, enable Auto-Pilot via the status bar.

## Features

- ✅ **Auto-Accept File Edits**: Saves time when agents propose multiple changes.
- ✅ **Auto-Execute Terminal Commands**: Keeps the context moving without manual intervention.
- ✅ **Smart Fallback**: Supports multiple ports for better compatibility across different environments.
