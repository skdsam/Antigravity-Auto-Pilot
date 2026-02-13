const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {
    Relauncher
} = require('./relauncher');
const {
    CDPHandler
} = require('./cdp-handler');

let isEnabled = false;
let statusBarItem;
let pollTimer;
let outputChannel;

const relauncher = new Relauncher(log);
const cdpHandler = new CDPHandler(log);

function log(msg) {
    const logMsg = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
    if (outputChannel) outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
    console.log(msg);
    try {
        fs.appendFileSync(path.join(__dirname, 'debug.log'), logMsg);
    } catch (e) {}
}

async function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Auto-Pilot');
    log('Auto-Pilot extension activating...');

    // Attempt to suppress Quokka welcome page
    try {
        const config = vscode.workspace.getConfiguration('quokka');
        if (config.get('showWelcomePage') !== false) {
            await config.update('showWelcomePage', false, vscode.ConfigurationTarget.Global);
            log('Suppressed Quokka welcome page in settings.');
        }
    } catch (e) {
        log(`Failed to suppress Quokka welcome page: ${e.message}`);
    }

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    statusBarItem.command = 'antigravity-autopilot.toggle';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
    statusBarItem.show();

    context.subscriptions.push(
        vscode.commands.registerCommand('antigravity-autopilot.toggle', () => handleToggle())
    );

    log('Activation complete.');
}

async function handleToggle() {
    isEnabled = !isEnabled;
    updateStatusBar();

    if (isEnabled) {
        log('Checking CDP availability...');
        const cdpAvailable = await cdpHandler.isCDPAvailable();

        if (cdpAvailable) {
            log('CDP available. Starting polling.');
            startPolling();
        } else {
            log('CDP not available. Prompting user.');
            await relauncher.ensureCDPAndRelaunch();
            isEnabled = false;
            updateStatusBar();
        }
    } else {
        stopPolling();
    }
}

function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    const automationScript = fs.readFileSync(path.join(__dirname, 'automation.js'), 'utf8');

    pollTimer = setInterval(async () => {
        if (!isEnabled) return;
        await cdpHandler.scanAndInject(automationScript);
    }, 2000);
    log('Auto-Pilot monitoring started.');
}

function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    log('Auto-Pilot monitoring stopped.');
}

function updateStatusBar() {
    if (isEnabled) {
        statusBarItem.text = '$(sync~spin) Auto-Pilot: ON';
        statusBarItem.tooltip = 'Click to disable Auto-Pilot';
        statusBarItem.color = '#32d74b';
    } else {
        statusBarItem.text = '$(circle-slash) Auto-Pilot: OFF';
        statusBarItem.tooltip = 'Click to enable Auto-Pilot';
        statusBarItem.color = undefined;
    }
}

function deactivate() {
    stopPolling();
}

module.exports = {
    activate,
    deactivate
};