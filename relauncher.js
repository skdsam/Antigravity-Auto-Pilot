const vscode = require('vscode');
const http = require('http');
const {
    exec,
    spawn
} = require('child_process');
const fs = require('fs');
const path = require('path');

class Relauncher {
    constructor(logger = console.log) {
        this.logger = logger;
    }

    log(msg) {
        this.logger(`[Relauncher] ${msg}`);
    }

    async findAntigravityExecutable() {
        // Default location on Windows
        const defaultPath = path.join(process.env.LOCALAPPDATA, 'antigravity', 'Antigravity.exe');
        if (fs.existsSync(defaultPath)) {
            return defaultPath;
        }

        // Try to find by process if running
        return new Promise((resolve) => {
            exec('powershell "Get-Process -Name Antigravity | Select-Object -ExpandProperty Path"', (err, stdout) => {
                if (!err && stdout.trim()) {
                    resolve(stdout.trim().split('\n')[0].trim());
                } else {
                    resolve(null);
                }
            });
        });
    }

    async relaunchWithFlags() {
        const exePath = await this.findAntigravityExecutable();
        if (!exePath) {
            vscode.window.showErrorMessage('Could not locate Antigravity executable automatically. Please start it manually with --remote-debugging-port=9222');
            return false;
        }

        this.log(`Attempting to relaunch: ${exePath}`);

        // Kill existing process first
        return new Promise((resolve) => {
            exec('taskkill /F /IM Antigravity.exe', () => {
                // Wait a moment for process to release locks
                setTimeout(() => {
                    const child = spawn(exePath, ['--remote-debugging-port=9222'], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    child.unref();
                    this.log('Relaunch command issued.');
                    resolve(true);
                }, 1000);
            });
        });
    }

    async ensureCDPAndRelaunch() {
        const choice = await vscode.window.showInformationMessage(
            'Auto-Pilot couldn\'t connect to Antigravity (ports 9000/9222/9223). Antigravity might need to be restarted with remote debugging enabled.',
            'Relaunch with Debugging', 'Open README', 'Cancel'
        );

        if (choice === 'Relaunch with Debugging') {
            return await this.relaunchWithFlags();
        }

        if (choice === 'Open README') {
            const readmePath = vscode.Uri.file(path.join(__dirname, 'README.md'));
            await vscode.commands.executeCommand('markdown.showPreview', readmePath);
        }
        return false;
    }
}

module.exports = {
    Relauncher
};