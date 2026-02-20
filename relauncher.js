const vscode = require('vscode');
const http = require('http');

class Relauncher {
    constructor(logger = console.log) {
        this.logger = logger;
    }

    log(msg) {
        this.logger(`[Relauncher] ${msg}`);
    }

    async ensureCDPAndRelaunch() {
        const choice = await vscode.window.showInformationMessage(
            'Auto-Pilot couldn\'t connect to Antigravity (ports 9000/9222/9223). Please ensure Antigravity is running or restart it with the remote debugging flag.',
            'Open README', 'Cancel'
        );

        if (choice === 'Open README') {
            const readmePath = vscode.Uri.file(require('path').join(__dirname, 'README.md'));
            await vscode.commands.executeCommand('markdown.showPreview', readmePath);
        }
        return false;
    }
}

module.exports = {
    Relauncher
};