const WebSocket = require('ws');
const http = require('http');

class CDPHandler {
    constructor(logger = console.log) {
        this.logger = logger;
        this.connections = new Map(); // id -> ws
        this.msgId = 1;
        this.targetPorts = [9000, 9222];
    }

    log(msg) {
        this.logger(`[CDP] ${msg}`);
    }

    async isCDPAvailable() {
        for (const port of this.targetPorts) {
            const available = await new Promise((resolve) => {
                const req = http.get({
                    hostname: '127.0.0.1',
                    port,
                    path: '/json/version',
                    timeout: 500
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
            });
            if (available) return true;
        }
        return false;
    }

    async scanAndInject(script) {
        for (const port of this.targetPorts) {
            try {
                const pages = await this._getPages(port);
                if (pages.length > 0) {
                    this.log(`Found ${pages.length} pages on port ${port}`);
                }
                for (const page of pages) {
                    this.log(`Checking page: ${page.title} (${page.url})`);
                    // Check if it's an Antigravity window or an agent-related view
                    if (page.title.includes('Antigravity') || page.url.includes('agent') || page.type === 'page') {
                        this.log(`Injecting into: ${page.title}`);
                        await this._evaluate(page.webSocketDebuggerUrl, script);
                    }
                }
            } catch (e) {
                this.log(`Error scanning port ${port}: ${e.message}`);
            }
        }
    }

    async _getPages(port) {
        return new Promise((resolve) => {
            const req = http.get({
                hostname: '127.0.0.1',
                port,
                path: '/json/list'
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body).filter(p => p.webSocketDebuggerUrl));
                    } catch (e) {
                        resolve([]);
                    }
                });
            });
            req.on('error', () => resolve([]));
            req.on('timeout', () => {
                req.destroy();
                resolve([]);
            });
        });
    }

    async _evaluate(wsUrl, expression) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout'));
            }, 2000);

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    id: this.msgId++,
                    method: 'Runtime.evaluate',
                    params: {
                        expression,
                        userGesture: true,
                        awaitPromise: true,
                        returnByValue: true
                    }
                }));
            });

            ws.on('message', (data) => {
                clearTimeout(timeout);
                ws.close();
                resolve(JSON.parse(data.toString()));
            });

            ws.on('error', (e) => {
                clearTimeout(timeout);
                reject(e);
            });
        });
    }
}

module.exports = {
    CDPHandler
};